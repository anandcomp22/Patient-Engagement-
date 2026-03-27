import os
import asyncio
import base64
import json
import uuid
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor
import subprocess
import tempfile
import torch
import wave

# -------------------------------------------------------
# FIX: PyTorch 2.6+ changed torch.load default to
# weights_only=True, which breaks Pyannote/WhisperX VAD
# model loading (uses omegaconf types in checkpoints).
# Allowlist the trusted omegaconf globals before import.
# -------------------------------------------------------
try:
    import omegaconf.listconfig
    import omegaconf.dictconfig
    import omegaconf.base
    import omegaconf.nodes
    torch.serialization.add_safe_globals([
        omegaconf.listconfig.ListConfig,
        omegaconf.dictconfig.DictConfig,
        omegaconf.base.ContainerMetadata,
        omegaconf.base.Metadata,
        omegaconf.nodes.AnyNode,
        omegaconf.nodes.IntegerNode,
        omegaconf.nodes.FloatNode,
        omegaconf.nodes.StringNode,
        omegaconf.nodes.BooleanNode,
        omegaconf.nodes.EnumNode,
        omegaconf.nodes.BytesNode,
        omegaconf.nodes.PathNode,
        omegaconf.nodes.InterpolationResultNode,
    ])
except Exception:
    pass  # omegaconf not installed or already patched

import whisperx
import websockets
from dotenv import load_dotenv

# Use the Ollama-based rag_service (fast, local LLM)
from rag_service import create_summary_and_store, sessions

# ---------------------------------------------------
# ENV
# ---------------------------------------------------
load_dotenv()

# ---------------------------------------------------
# THREAD POOL — for offloading blocking work
# ---------------------------------------------------
executor = ThreadPoolExecutor(max_workers=4)

# ---------------------------------------------------
# LOAD WHISPERX
# ---------------------------------------------------
device = "cuda" if torch.cuda.is_available() else "cpu"
compute_type = "float16" if device == "cuda" else "int8"

print(f"Loading WhisperX model on {device}...")

model = whisperx.load_model(
    "base.en", # Switched from 'small' to 'base.en' for faster real-time performance
    device=device,
    compute_type=compute_type, # properly use the variable correctly rather than hardcoding int8
    vad_model=None 
)

print("WhisperX loaded successfully!")

# ---------------------------------------------------
# HOW OFTEN TO EMIT A PARTIAL TRANSCRIPT
# Browser sends one chunk every ~3s (timeslice=3000ms).
# PARTIAL_EVERY=4 => ~12s between partial updates.
# ---------------------------------------------------
PARTIAL_EVERY = 1

def decode_pcm_base64(base64_data):
    """Decode a base64-encoded raw PCM chunk to bytes (no WAV header)."""
    return base64.b64decode(base64_data)


def pcm_to_wav_file(pcm_bytes, sample_rate=16000):
    """Write raw PCM bytes to a temporary WAV file and return its path."""
    with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
        with wave.open(tmp, "wb") as wf:
            wf.setnchannels(1)
            wf.setsampwidth(2)  # 16-bit
            wf.setframerate(sample_rate)
            wf.writeframes(pcm_bytes)
        return tmp.name

# ---------------------------------------------------
# BLOCKING TRANSCRIPTION WORKER
# Runs in thread pool so it never blocks the event loop.
# Accepts raw PCM bytes (no WAV header) and builds a
# proper WAV file once before passing to WhisperX.
# ---------------------------------------------------
def _transcribe_pcm_bytes(pcm_bytes, sample_rate=16000, language="en"):
    """Convert raw PCM bytes -> WAV file -> WhisperX -> plain text.
    Returns empty string if audio is too short or no speech detected.
    """
    # ~1.25 seconds of audio minimum (20 000 bytes / 2 bytes per sample / 16000 Hz)
    if len(pcm_bytes) < 20_000:
        return ""

    # --- RMS energy gate ---
    # WhisperX/Whisper hallucinates random phrases on silent audio.
    # Compute the RMS of the raw PCM16 samples; skip if too quiet.
    import struct
    num_samples = len(pcm_bytes) // 2
    samples = struct.unpack(f"<{num_samples}h", pcm_bytes[:num_samples * 2])
    rms = (sum(s * s for s in samples) / num_samples) ** 0.5
    if rms < 200:   # threshold on 0–32767 scale; raise if still hallucinating
        print(f"[skip] Audio too quiet (RMS={rms:.1f}), skipping transcription.")
        return ""

    wav_path = pcm_to_wav_file(pcm_bytes, sample_rate)

    try:
        result = model.transcribe(wav_path, batch_size=8, language=language)
        segments = result.get("segments", [])
        if not segments:
            return ""
        return " ".join(seg["text"].strip() for seg in segments if seg.get("text"))
    except IndexError:
        # pyannote VAD returns empty list when no active speech — not a real error
        return ""
    except Exception as e:
        print(f"[_transcribe_pcm_bytes error] {e}")
        return ""
    finally:
        if os.path.exists(wav_path):
            os.remove(wav_path)



# ---------------------------------------------------
# BLOCKING SUMMARIZE WORKER
# Calls the project's rag_engine.store_summary_and_run_rag
# which does: LLM summary -> store ChromaDB -> auto RAG
# ---------------------------------------------------
def _summarize_and_store(session_id, full_text):
    """Blocking call to rag_service — runs in thread pool."""
    try:
        summary = create_summary_and_store(session_id, full_text)
        return summary
    except Exception as e:
        print(f"[summarize_and_store error] {e}")
        return full_text[:300]  # fallback: return truncated transcript


# ---------------------------------------------------
# ASYNC HELPERS
# ---------------------------------------------------
async def transcribe_async(pcm_bytes, sample_rate=16000, language="en"):
    loop = asyncio.get_event_loop()

    text = await loop.run_in_executor(
        executor,
        _transcribe_pcm_bytes,
        pcm_bytes,
        sample_rate,
        language
    )

    return text.strip()


async def summarize_async(session_id, full_text):
    """Non-blocking: LLM summarize + store in ChromaDB/Mongo."""
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(
        executor,
        _summarize_and_store,
        session_id,
        full_text
    )


# ---------------------------------------------------
# WEBSOCKET HANDLER
# ---------------------------------------------------
async def handler(ws):

    session_id   = None
    audio_buffer = b""
    transcript   = ""
    chunk_count  = 0
    partial_task = None

    try:
        async for message in ws:

            payload  = json.loads(message)
            msg_type = payload.get("type")

            # ------------------------------------------
            # START SESSION
            # ------------------------------------------
            if msg_type == "start":

                session_id   = payload.get("session_id") or f"session_{uuid.uuid4().hex[:8]}"
                audio_buffer = b""
                transcript   = ""
                chunk_count  = 0

                # Upsert session in MongoDB
                sessions.update_one(
                    {"_id": session_id},
                    {"$set": {
                        "patient_id":     payload.get("patient_id", "patient_101"),
                        "doctor_id":      payload.get("doctor_id", ""),
                        "start_time":     datetime.utcnow(),
                        "session_status": "open",
                        "transcript_raw": [],
                        "qa":             []
                    }},
                    upsert=True
                )

                print(f"[WS] Session started: {session_id}")

                await ws.send(json.dumps({
                    "status":     "started",
                    "session_id": session_id
                }))

            # ------------------------------------------
            # AUDIO CHUNK — buffer + periodic partial
            # ------------------------------------------
            elif msg_type == "audio_chunk" and session_id:

                chunk_base64 = payload["data"]
                sample_rate  = payload.get("sample_rate", 16000)

                # FIX: accumulate RAW PCM bytes — NOT WAV bytes.
                # Concatenating WAV blobs creates multiple headers that ffmpeg rejects.
                pcm_bytes = decode_pcm_base64(chunk_base64)
                audio_buffer += pcm_bytes

                # Keep only the last 10 seconds of raw PCM to avoid runaway memory.
                MAX_BUFFER = sample_rate * 10 * 2  # 10 sec × sample_rate × 2 bytes/sample
                audio_buffer = audio_buffer[-MAX_BUFFER:]

                chunk_count += 1

                if chunk_count % PARTIAL_EVERY == 0:
                    # Take a snapshot of the last 5 seconds for partial transcription.
                    snapshot     = audio_buffer[-sample_rate * 5 * 2:]
                    snap_rate    = sample_rate

                    async def emit_partial(snap=snapshot, rate=snap_rate):
                        nonlocal transcript
                        try:
                            text = await transcribe_async(snap, rate)
                            if text:
                                transcript = text
                                await ws.send(json.dumps({
                                    "type": "partial_transcript",
                                    "text": text
                                }))
                        except Exception as e:
                            print("Partial transcription error:", e)

                    if partial_task and not partial_task.done():
                        partial_task.cancel()

                    partial_task = asyncio.ensure_future(emit_partial())

            # ------------------------------------------
            # END SESSION -> Final transcript + summary
            # ------------------------------------------
            elif msg_type == "end" and session_id:

                if not audio_buffer:
                    await ws.send(json.dumps({"error": "No audio recorded"}))
                    continue

                print(f"[{session_id}] Processing full audio…")

                if partial_task and not partial_task.done():
                    partial_task.cancel()

                # FIX: pass raw PCM + sample_rate; WAV is built inside transcribe_async.
                full_text = await transcribe_async(audio_buffer, sample_rate)

                if not full_text:
                    await ws.send(json.dumps({"error": "Transcription returned empty"}))
                    continue

                transcript = full_text

                # Store raw transcript in MongoDB
                sessions.update_one(
                    {"_id": session_id},
                    {"$set": {"transcript_raw": [full_text]}}
                )

                # Send final transcript immediately so UI can show it
                await ws.send(json.dumps({
                    "type": "final_transcript",
                    "text": full_text
                }))

                # Summarize + store in ChromaDB (non-blocking)
                summary = await summarize_async(session_id, full_text)

                # Close session in MongoDB
                sessions.update_one(
                    {"_id": session_id},
                    {"$set": {
                        "end_time":       datetime.utcnow(),
                        "session_status": "closed"
                    }}
                )

                # Send summary — frontend will then hit /rag/answer on Node
                await ws.send(json.dumps({
                    "type":       "summary",
                    "text":       summary,
                    "session_id": session_id
                }))

                print(f"[{session_id}] Done.")

                # Reset for next session on same socket
                audio_buffer = b""
                transcript   = ""
                chunk_count  = 0

    except websockets.ConnectionClosed:
        print(f"[WS] Connection closed for session: {session_id}")

    except Exception as e:
        print("Server Error:", str(e))
        try:
            await ws.send(json.dumps({"error": str(e)}))
        except Exception:
            pass


# ---------------------------------------------------
# MAIN
# ---------------------------------------------------
async def main():
    async with websockets.serve(handler, "0.0.0.0", 8765):
        print("Transcription WebSocket Server running at ws://0.0.0.0:8765")
        await asyncio.Future()


if __name__ == "__main__":
    asyncio.run(main())