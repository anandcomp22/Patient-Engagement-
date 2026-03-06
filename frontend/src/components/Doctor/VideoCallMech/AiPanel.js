import React, { useEffect, useRef, useState, useCallback } from "react";
import {
    Box,
    Typography,
    Paper,
    Chip,
    Divider,
    CircularProgress,
    Collapse,
    Button,
} from "@mui/material";
import MicIcon from "@mui/icons-material/Mic";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import MedicationIcon from "@mui/icons-material/Medication";
import AssignmentIcon from "@mui/icons-material/Assignment";
import SearchIcon from "@mui/icons-material/Search";

// ---------------------------------------------------------------------------
// AiPanel
// Props:
//   localStream      — MediaStream from the local video/mic (passed from VideoCall)
//   active           — boolean; true when call is joined, false otherwise
//   sessionId        — string used as the RAG session ID (e.g. roomId)
//   patientId        — string patient identifier
//   doctorId         — string doctor identifier
//   liveTranscript   — string; current cumulative transcript text from VideoCall (for on-demand retrieval)
//   onMedicinesFound — callback(medicines[]) so parent can populate prescription
// ---------------------------------------------------------------------------
const AI_WS_URL = "ws://localhost:8765";          // WhisperX WebSocket transcription server
const RAG_API_URL = "http://localhost:8000/rag/answer"; // Node.js (port 8000) proxies to Python Flask (port 5000)

const STATUS_LABELS = {
    idle: { label: "Waiting for call…", color: "default" },
    recording: { label: "🔴 Recording & Transcribing", color: "error" },
    partial: { label: "📝 Live transcript updating", color: "warning" },
    transcribing: { label: "⚙️ Finalising transcript…", color: "warning" },
    analyzing: { label: "🧠 AI analysing…", color: "secondary" },
    done: { label: "✅ Analysis complete", color: "success" },
    error: { label: "⚠️ Error — see console", color: "error" },
};

const AiPanel = ({
    localStream,
    active,
    sessionId,
    patientId = "patient_101",
    doctorId = "",
    liveTranscript = "",
    onMedicinesFound,
}) => {
    const wsRef = useRef(null);
    const recorderRef = useRef(null);
    const partialTaskRef = useRef(null);

    const [status, setStatus] = useState("idle");
    const [liveText, setLiveText] = useState("");
    const [finalTranscript, setFinalTranscript] = useState("");
    const [ragAnswer, setRagAnswer] = useState("");
    const [medicines, setMedicines] = useState([]);
    const [expanded, setExpanded] = useState(true);
    // On-demand retrieval state
    const [retrieving, setRetrieving] = useState(false);
    const [onDemandMeds, setOnDemandMeds] = useState([]);
    const [retrieveMsg, setRetrieveMsg] = useState("");

    const liveBoxRef = useRef(null);

    // Auto-scroll live transcript
    useEffect(() => {
        if (liveBoxRef.current) {
            liveBoxRef.current.scrollTop = liveBoxRef.current.scrollHeight;
        }
    }, [liveText]);

    // -----------------------------------------------------------------------
    // RAG call — hit Node proxy which forwards to Python /rag/answer
    // -----------------------------------------------------------------------
    const triggerRag = useCallback(async (sid) => {
        setStatus("analyzing");
        try {
            const res = await fetch(RAG_API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    session_id: sid,
                    question:
                        "Based on the consultation transcript, recommend appropriate medicines for the patient's condition.",
                }),
            });
            const data = await res.json();
            if (data.ok) {
                setRagAnswer(data.answer || "");
                const meds = (data.documents || []).map((doc, i) => ({
                    docText: doc,
                    metadata: (data.metadata || [])[i] || {},
                }));
                setMedicines(meds);
                if (onMedicinesFound) onMedicinesFound(meds);
            } else {
                setRagAnswer("Error: " + (data.error || "Unknown error from RAG API"));
            }
        } catch (err) {
            console.error("[AiPanel] RAG fetch error:", err);
            setRagAnswer("Network error contacting RAG API (is Python running on port 5000?)");
            setStatus("error");
            return;
        }
        setStatus("done");
    }, [onMedicinesFound]);

    // -----------------------------------------------------------------------
    // ON-DEMAND retrieval — doctor clicks the button mid-call
    // Fast path: keyword extract → ChromaDB (no LLM, no summarization)
    // -----------------------------------------------------------------------
    const handleRetrieveNow = useCallback(async () => {
        const transcript = liveTranscript || liveText || finalTranscript;
        if (!transcript.trim()) {
            setRetrieveMsg("⚠️ No transcript captured yet — keep talking!");
            return;
        }
        setRetrieving(true);
        setRetrieveMsg("");
        setOnDemandMeds([]);
        try {
            const res = await fetch("http://localhost:8000/rag/session/retrieve-meds-now", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    session_id: sessionId,
                    raw_transcript: transcript,
                }),
            });
            const data = await res.json();
            if (data.ok) {
                if (!data.documents || data.documents.length === 0) {
                    setRetrieveMsg(data.message || "No medicines found for current context.");
                } else {
                    const meds = data.documents.map((doc, i) => ({
                        docText: doc,
                        metadata: (data.metadata || [])[i] || {},
                    }));
                    setOnDemandMeds(meds);
                    setRetrieveMsg(`✅ Found ${meds.length} medicine(s) — keywords: ${(data.keywords || []).slice(0, 4).join(", ")}`);
                    if (onMedicinesFound) onMedicinesFound(meds);
                }
            } else {
                setRetrieveMsg("⚠️ Error: " + (data.error || "RAG API error"));
            }
        } catch (err) {
            console.error("[AiPanel] retrieve-meds-now error:", err);
            setRetrieveMsg("⚠️ Network error — is the Python RAG server running on port 5000?");
        } finally {
            setRetrieving(false);
        }
    }, [liveTranscript, liveText, finalTranscript, sessionId, onMedicinesFound]);

    // -----------------------------------------------------------------------
    // Start: open WS + MediaRecorder when call becomes active
    // -----------------------------------------------------------------------
    useEffect(() => {
        if (!active || !localStream || !sessionId) return;

        // Reset state for a new call
        setLiveText("");
        setFinalTranscript("");
        setRagAnswer("");
        setMedicines([]);
        setStatus("recording");

        // --- WebSocket ---
        const ws = new WebSocket(AI_WS_URL);
        wsRef.current = ws;

        ws.onopen = () => {
            ws.send(
                JSON.stringify({
                    type: "start",
                    session_id: sessionId,
                    patient_id: patientId,
                    doctor_id: doctorId,
                })
            );
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);

                if (data.status === "started") {
                    // Begin recording NOW that the server acknowledged the session
                    if (recorderRef.current?.state === "inactive") {
                        recorderRef.current.start(3000); // send a chunk every 3 seconds
                    }
                }

                if (data.type === "partial_transcript" && data.text) {
                    setLiveText(data.text);
                    setStatus("partial");
                }

                if (data.type === "final_transcript" && data.text) {
                    setFinalTranscript(data.text);
                    setLiveText(data.text);
                    setStatus("transcribing");
                }

                if (data.type === "summary") {
                    // Summary stored — now trigger the RAG answer
                    triggerRag(data.session_id || sessionId);
                }

                if (data.error) {
                    console.error("[AiPanel WS error]", data.error);
                    setStatus("error");
                }
            } catch (e) {
                console.error("[AiPanel] Failed to parse WS message", e);
            }
        };

        ws.onerror = (err) => {
            console.error("[AiPanel] WebSocket error:", err);
            setStatus("error");
        };

        // --- MediaRecorder (audio-only from local stream) ---
        const audioStream = new MediaStream(localStream.getAudioTracks());
        let recorder;
        try {
            recorder = new MediaRecorder(audioStream, {
                mimeType: "audio/webm;codecs=opus",
            });
        } catch (_) {
            recorder = new MediaRecorder(audioStream); // fallback
        }
        recorderRef.current = recorder;

        recorder.ondataavailable = async (event) => {
            if (event.data.size > 0 && ws.readyState === WebSocket.OPEN) {
                const buf = await event.data.arrayBuffer();
                const u8 = new Uint8Array(buf);
                let binary = "";
                for (let i = 0; i < u8.length; i++) binary += String.fromCharCode(u8[i]);
                ws.send(
                    JSON.stringify({ type: "audio_chunk", data: btoa(binary) })
                );
            }
            console.log(recorder)
        };

        // Cleanup when call ends (active becomes false)
        return () => {
            // stop recorder
            if (recorderRef.current && recorderRef.current.state !== "inactive") {
                recorderRef.current.stop();
            }
            // tell transcription server to finalise & summarise
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: "end" }));
                setStatus("transcribing");
            }
            // close WS after a short delay to let "end" message arrive
            setTimeout(() => {
                ws.close();
            }, 1000);
        };
    }, [active, localStream, sessionId, patientId, doctorId, triggerRag]);

    // -----------------------------------------------------------------------
    // Render
    // -----------------------------------------------------------------------
    const { label: statusLabel, color: statusColor } =
        STATUS_LABELS[status] || STATUS_LABELS.idle;

    const isLoading =
        status === "transcribing" || status === "analyzing";

    return (
        <Box sx={{ mt: 2 }}>
            {/* Header row */}
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    cursor: "pointer",
                    mb: 0.5,
                }}
                onClick={() => setExpanded((p) => !p)}
            >
                <Typography
                    variant="subtitle1"
                    fontWeight="bold"
                    sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                >
                    <SmartToyIcon fontSize="small" color="primary" />
                    AI Assistant
                </Typography>
                <Chip
                    label={statusLabel}
                    color={statusColor}
                    size="small"
                    sx={{ fontSize: "0.65rem" }}
                />
            </Box>

            <Collapse in={expanded}>
                <Divider sx={{ mb: 1 }} />

                {/* ── ON-DEMAND RETRIEVE BUTTON ── */}
                {active && (
                    <Box sx={{ mb: 1.5 }}>
                        <Button
                            variant="contained"
                            color="secondary"
                            fullWidth
                            size="small"
                            startIcon={retrieving ? <CircularProgress size={14} color="inherit" /> : <SearchIcon />}
                            onClick={handleRetrieveNow}
                            disabled={retrieving}
                            sx={{
                                textTransform: "none",
                                fontWeight: "bold",
                                fontSize: "0.82rem",
                                borderRadius: 2,
                                background: retrieving
                                    ? undefined
                                    : "linear-gradient(90deg, #6a1b9a, #1565c0)",
                                "&:hover": {
                                    background: retrieving
                                        ? undefined
                                        : "linear-gradient(90deg, #4a148c, #0d47a1)",
                                },
                            }}
                        >
                            {retrieving ? "Searching medicines…" : "🔍 Retrieve Medicines Now"}
                        </Button>
                        {retrieveMsg && (
                            <Typography
                                variant="caption"
                                color={retrieveMsg.startsWith("✅") ? "success.main" : "error.main"}
                                sx={{ display: "block", mt: 0.5, fontSize: "0.72rem" }}
                            >
                                {retrieveMsg}
                            </Typography>
                        )}
                    </Box>
                )}

                {/* ── ON-DEMAND MEDICINE RESULTS (shown mid-call) ── */}
                {onDemandMeds.length > 0 && (
                    <Box sx={{ mb: 1.5 }}>
                        <Typography
                            variant="caption"
                            fontWeight="bold"
                            sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}
                        >
                            <MedicationIcon sx={{ fontSize: 14 }} color="secondary" />
                            Retrieved Now ({onDemandMeds.length})
                        </Typography>
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75, maxHeight: 200, overflowY: "auto" }}>
                            {onDemandMeds.map((med, i) => (
                                <Paper
                                    key={i}
                                    variant="outlined"
                                    sx={{
                                        p: 1,
                                        bgcolor: "#f3e5f5",
                                        borderRadius: 1,
                                        borderColor: "secondary.light",
                                    }}
                                >
                                    <Typography
                                        variant="body2"
                                        fontWeight="bold"
                                        color="secondary.dark"
                                        sx={{ fontSize: "0.8rem", mb: 0.25 }}
                                    >
                                        💊 {med.metadata?.drug_name || `Medicine ${i + 1}`}
                                    </Typography>
                                    {med.metadata?.indications && (
                                        <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                                            <b>Use:</b> {String(med.metadata.indications).slice(0, 100)}…
                                        </Typography>
                                    )}
                                    {med.metadata?.dosage && (
                                        <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                                            <b>Dosage:</b> {med.metadata.dosage}
                                        </Typography>
                                    )}
                                </Paper>
                            ))}
                        </Box>
                    </Box>
                )}

                {/* Live Transcript Box */}
                <Box sx={{ mb: 1 }}>
                    <Typography
                        variant="caption"
                        fontWeight="bold"
                        sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}
                    >
                        <MicIcon sx={{ fontSize: 14 }} color={status === "recording" || status === "partial" ? "error" : "disabled"} />
                        Live Transcript
                        {(status === "recording" || status === "partial") && (
                            <Box
                                component="span"
                                sx={{
                                    display: "inline-block",
                                    width: 6,
                                    height: 6,
                                    borderRadius: "50%",
                                    bgcolor: "error.main",
                                    ml: 0.5,
                                    animation: "aidme-pulse 1s ease-in-out infinite",
                                }}
                            />
                        )}
                    </Typography>
                    <Paper
                        ref={liveBoxRef}
                        variant="outlined"
                        sx={{
                            p: 1,
                            minHeight: 60,
                            maxHeight: 120,
                            overflowY: "auto",
                            bgcolor: "grey.50",
                            borderRadius: 1,
                        }}
                    >
                        {liveText ? (
                            <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", fontSize: "0.8rem" }}>
                                {liveText}
                            </Typography>
                        ) : (
                            <Typography variant="body2" color="text.disabled" fontSize="0.78rem">
                                {active
                                    ? "Listening for conversation…"
                                    : "Join the call to start live transcription."}
                            </Typography>
                        )}
                    </Paper>
                </Box>

                {/* Loading spinner */}
                {isLoading && (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                        <CircularProgress size={16} />
                        <Typography variant="caption" color="text.secondary">
                            {status === "transcribing"
                                ? "WhisperX finalising full transcript…"
                                : "AI (Ollama) searching ChromaDB for medicines…"}
                        </Typography>
                    </Box>
                )}

                {/* Final transcript card */}
                {finalTranscript && status !== "recording" && status !== "partial" && (
                    <Box sx={{ mb: 1 }}>
                        <Typography
                            variant="caption"
                            fontWeight="bold"
                            sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}
                        >
                            <AssignmentIcon sx={{ fontSize: 14 }} />
                            Consultation Notes
                        </Typography>
                        <Paper
                            variant="outlined"
                            sx={{
                                p: 1,
                                maxHeight: 100,
                                overflowY: "auto",
                                bgcolor: "#f0f4ff",
                                borderRadius: 1,
                            }}
                        >
                            <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", fontSize: "0.78rem" }}>
                                {finalTranscript}
                            </Typography>
                        </Paper>
                    </Box>
                )}

                {/* AI Recommendation */}
                {ragAnswer && status === "done" && (
                    <Box sx={{ mb: 1 }}>
                        <Typography
                            variant="caption"
                            fontWeight="bold"
                            sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}
                        >
                            <SmartToyIcon sx={{ fontSize: 14 }} color="primary" />
                            AI Recommendation
                        </Typography>
                        <Paper
                            variant="outlined"
                            sx={{
                                p: 1,
                                bgcolor: "#f0fff4",
                                borderRadius: 1,
                                borderColor: "success.light",
                            }}
                        >
                            <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", fontSize: "0.8rem" }}>
                                {ragAnswer}
                            </Typography>
                        </Paper>
                    </Box>
                )}

                {/* Medicine Cards */}
                {medicines.length > 0 && status === "done" && (
                    <Box>
                        <Typography
                            variant="caption"
                            fontWeight="bold"
                            sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}
                        >
                            <MedicationIcon sx={{ fontSize: 14 }} color="secondary" />
                            Retrieved Medicines ({medicines.length})
                        </Typography>
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75, maxHeight: 220, overflowY: "auto" }}>
                            {medicines.map((med, i) => (
                                <Paper
                                    key={i}
                                    variant="outlined"
                                    sx={{
                                        p: 1,
                                        bgcolor: "#fffef0",
                                        borderRadius: 1,
                                        borderColor: "warning.light",
                                    }}
                                >
                                    <Typography
                                        variant="body2"
                                        fontWeight="bold"
                                        color="warning.dark"
                                        sx={{ fontSize: "0.8rem", mb: 0.25 }}
                                    >
                                        💊 {med.metadata?.drug_name || `Medicine ${i + 1}`}
                                    </Typography>
                                    {med.metadata?.indications && (
                                        <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                                            <b>Use:</b> {String(med.metadata.indications).slice(0, 100)}…
                                        </Typography>
                                    )}
                                    {med.metadata?.dosage && (
                                        <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                                            <b>Dosage:</b> {med.metadata.dosage}
                                        </Typography>
                                    )}
                                </Paper>
                            ))}
                        </Box>
                    </Box>
                )}
            </Collapse>

            {/* Keyframe animation for live pulse dot */}
            <style>{`
        @keyframes aidme-pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.2; }
        }
      `}</style>
        </Box>
    );
};

export default AiPanel;
