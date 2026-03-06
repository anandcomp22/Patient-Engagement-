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
    "base",
    device=device,
    compute_type=compute_type
)

print("WhisperX loaded successfully!")

# ---------------------------------------------------
# HOW OFTEN TO EMIT A PARTIAL TRANSCRIPT
# Browser sends one chunk every ~3s (timeslice=3000ms).
# PARTIAL_EVERY=4 => ~12s between partial updates.
# ---------------------------------------------------
PARTIAL_EVERY = 4

# ---------------------------------------------------
# AUDIO CONVERSION  (bytes -> 16 kHz mono WAV bytes)
# ---------------------------------------------------
def convert_audio_bytes_to_wav_bytes(audio_bytes):
    """Write to temp file so FFmpeg can seek the container headers."""
    with tempfile.NamedTemporaryFile(delete=False, suffix=".audio") as raw_tmp:
        raw_tmp.write(audio_bytes)
        raw_tmp_path = raw_tmp.name

    out_wav_path = raw_tmp_path + ".wav"

    ffmpeg_cmd = [
        "ffmpeg", "-y",
        "-i", raw_tmp_path,
        "-ar", "16000",
        "-ac", "1",
        "-f", "wav",
        out_wav_path
    ]

    try:
        result = subprocess.run(
            ffmpeg_cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )

        if result.returncode != 0:
            print("FFMPEG ERROR:", result.stderr.decode()[-300:])
            return None

        with open(out_wav_path, "rb") as f:
            return f.read()

    finally:
        if os.path.exists(raw_tmp_path):
            os.remove(raw_tmp_path)
        if os.path.exists(out_wav_path):
            os.remove(out_wav_path)


# ---------------------------------------------------
# BLOCKING TRANSCRIPTION WORKER
# Runs in thread pool so it never blocks the event loop.
# ---------------------------------------------------
def _transcribe_wav_bytes(wav_bytes, language="en"):
    """Convert wav bytes -> WhisperX -> plain text.
    Returns empty string if no speech detected (instead of crashing).
    """
    # Skip chunks too small to contain real speech (~2s minimum at 16kHz/16bit)
    if len(wav_bytes) < 64_000:
        return ""

    with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
        tmp.write(wav_bytes)
        wav_path = tmp.name

    try:
        result = model.transcribe(wav_path, batch_size=8, language=language)
        segments = result.get("segments", [])
        if not segments:
            return ""
        return " ".join(seg["text"].strip() for seg in segments if seg.get("text"))
    except IndexError:
        # pyannote VAD returns empty list when no active speech found — not a real error
        return ""
    except Exception as e:
        print(f"[_transcribe_wav_bytes error] {e}")
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
async def transcribe_async(audio_bytes, language="en"):
    """Non-blocking: convert audio + WhisperX transcribe."""
    loop = asyncio.get_event_loop()

    wav_bytes = await loop.run_in_executor(
        executor,
        convert_audio_bytes_to_wav_bytes,
        audio_bytes
    )

    if not wav_bytes:
        return ""

    text = await loop.run_in_executor(
        executor,
        _transcribe_wav_bytes,
        wav_bytes,
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

                chunk_bytes   = base64.b64decode(payload["data"])
                audio_buffer += chunk_bytes
                chunk_count  += 1

                if chunk_count % PARTIAL_EVERY == 0:
                    snapshot = audio_buffer

                    async def emit_partial(snap=snapshot):
                        nonlocal transcript
                        try:
                            text = await transcribe_async(snap)
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

                # Full transcription
                full_text = await transcribe_async(audio_buffer)

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
