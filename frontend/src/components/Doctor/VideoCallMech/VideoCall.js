import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  Box, Typography, Paper, IconButton, Button, TextField,
  Divider, Tooltip, Fade, Chip, Avatar, Collapse,
  Dialog, DialogTitle, DialogContent, DialogActions,
} from "@mui/material";
import {
  MicOff, Mic, Videocam, VideocamOff, CallEnd,
  Fullscreen, FullscreenExit, ContentCopy, Send,
  Add, PersonOutline, SmartToy, Download, Email, Save, Visibility,
} from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";
import { io } from "socket.io-client";
import AiPanel from "./AiPanel";
import PrescriptionTemplate from "../Dashboard/PrescriptionTemplate";
import html2pdf from "html2pdf.js";

const VideoCall = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const socketRef = useRef(null);
  const queryParams = new URLSearchParams(location.search);
  const initialRoomId = queryParams.get("roomId") || "";
  const patientEmail = queryParams.get("patientEmail");
  const patientName = queryParams.get("patientName") || "Patient";
  const patientId = queryParams.get("patientId") || "202";

  const [roomId, setRoomId] = useState(initialRoomId);
  const [name, setName] = useState("");
  const [joined, setJoined] = useState(false);
  const [patientJoined, setPatientJoined] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [callDuration, setCallDuration] = useState(0);

  // Prescription state
  const [medications, setMedications] = useState([]);
  const [medName, setMedName] = useState("");
  const [dosage, setDosage] = useState("");
  const [frequency, setFrequency] = useState("");
  const [duration, setDuration] = useState("");
  const [notes, setNotes] = useState("");
  const [showMedForm, setShowMedForm] = useState(false);
  const [detectedCondition, setDetectedCondition] = useState("");
  const [callStartTime, setCallStartTime] = useState(null);
  const [copied, setCopied] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnection = useRef(null);
  const callEndedRef = useRef(false);
  const videoContainerRef = useRef(null);
  const controlsTimer = useRef(null);
  const durationTimer = useRef(null);

  const doctorId = localStorage.getItem("doctorId") || "doctor_unknown";
  const API_BASE = "http://localhost:8000";

  // ── Helpers ────────────────────────────────────────────────
  const formatDuration = (s) => {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };

  const resetControlsTimer = useCallback(() => {
    setControlsVisible(true);
    clearTimeout(controlsTimer.current);
    controlsTimer.current = setTimeout(() => setControlsVisible(false), 4000);
  }, []);

  // ── Manual E-Prescription Actions ────────────────────────────
  const prescriptionPreviewData = {
    doctor: name,
    specialization: "General Medicine",
    license: "MED-CLINIC-X",
    patient: patientName,
    age: "",
    gender: "",
    diagnosis: detectedCondition || (notes ? notes.split('.')[0] : "Consultation in progress"),
    medicines: medications.filter(m => m.name.trim() !== ""),
    guidelines: notes ? notes.split("\n").filter(g => g.trim() !== "") : [],
    nextVisit: "TBD"
  };

  const handleSavePrescription = async () => {
    const filename = `prescription_${patientName.replace(/\s+/g, "_")}.pdf`;
    const pData = {
      patientId, patient: patientName, age: "N/A", address: "Teleconsultation", contact: "N/A",
      prescriptionNo: `RX-${Date.now()}`, date: new Date().toLocaleDateString(),
      email: patientEmail || "patient@clinic.com", medicines: medications.length > 0 ? medications : [{ name: "General Advice", dosage: "-", frequency: "-", duration: "-" }], notes: notes || "No additional notes",
    };
    try {
      await fetch(`${API_BASE}/prescriptions/generate`, {
        method: "POST", 
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        }, 
        body: JSON.stringify(pData),
      });

      const element = document.getElementById("prescription-template-doc");
      if (!element) throw new Error("Template not found in DOM");

      const pdfBlob = await html2pdf().set({
        margin: 10,
        filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      }).from(element).outputPdf('blob');

      const formData = new FormData();
      formData.append("prescriptionPdf", pdfBlob, filename);
      const res = await fetch(`${API_BASE}/prescriptions/uploadPdf`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` },
        body: formData
      });
      const data = await res.json();
      if (data.file) alert("High-fidelity PDF generated & securely saved!");
      else alert("Failed to save high-fidelity PDF!");
    } catch (e) { alert("Error saving prescription."); }
  };

  const handleDownload = async () => {
    const filename = `prescription_${patientName.replace(/\s+/g, "_")}.pdf`;
    const element = document.getElementById("prescription-template-doc");
    if (!element) return;
    try {
      await html2pdf().set({
        margin: 10,
        filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      }).from(element).save();
    } catch (e) { alert("Error downloading directly from UI"); }
  };

  const handleSendEmail = () => {
    const filename = `prescription_${patientName.replace(/\s+/g, "_")}.pdf`;
    fetch(`${API_BASE}/prescriptions/send`, {
      method: "POST", 
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("token")}`
      },
      body: JSON.stringify({ email: patientEmail, file: filename }),
    })
      .then(res => {
        if (!res.ok) throw new Error("Unauthorized");
        return res.json();
      })
      .then(() => alert(`Email securely sent to ${patientEmail}!`))
      .catch(() => alert("Error sending email. Save it first!"));
  };

  // ── Socket init ────────────────────────────────────────────
  useEffect(() => {
    socketRef.current = io("http://localhost:8000", { transports: ["websocket"] });
    return () => socketRef.current.disconnect();
  }, []);

  // ── Name from storage ──────────────────────────────────────
  useEffect(() => {
    const n = localStorage.getItem("doctorName");
    if (n) setName(n);
  }, []);

  // ── Call timer ─────────────────────────────────────────────
  useEffect(() => {
    if (joined) {
      setCallStartTime(new Date().toISOString());
      durationTimer.current = setInterval(() => setCallDuration(d => d + 1), 1000);
      resetControlsTimer();
    }
    return () => { clearInterval(durationTimer.current); clearTimeout(controlsTimer.current); };
  }, [joined, resetControlsTimer]);

  // ── Fullscreen listener ────────────────────────────────────
  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFsChange);
    document.addEventListener("webkitfullscreenchange", onFsChange);
    return () => {
      document.removeEventListener("fullscreenchange", onFsChange);
      document.removeEventListener("webkitfullscreenchange", onFsChange);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      videoContainerRef.current?.requestFullscreen().catch(() => { });
    } else {
      document.exitFullscreen().catch(() => { });
    }
  };

  // ── Generate Room ID ───────────────────────────────────────
  const generateRoomId = () => {
    setRoomId(Math.random().toString(36).substring(2, 8).toUpperCase());
  };

  const copyLink = () => {
    const link = `${window.location.origin}/patient/video-call?roomId=${roomId}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── AI medicines callback ──────────────────────────────────
  const handleAiMedicines = useCallback((meds) => {
    const newMeds = meds
      .filter(m => m.metadata?.drug_name)
      .map(m => ({ name: m.metadata.drug_name, dosage: m.metadata.dosage || "", frequency: "", duration: "" }));
    setMedications(prev => {
      const existing = new Set(prev.map(p => p.name?.toLowerCase()));
      return [...prev, ...newMeds.filter(m => !existing.has(m.name.toLowerCase()))];
    });
  }, []); // no deps — only uses setMedications (stable setter)

  // ── Join ───────────────────────────────────────────────────
  const joinRoom = async () => {
    if (joined) return;
    if (!roomId || !name) { alert("Please enter Room ID and Name"); return; }
    socketRef.current.emit("join-room", { roomId });
    setJoined(true);
  };

  // ── WebRTC ─────────────────────────────────────────────────
  useEffect(() => {
    if (!joined) return;
    peerConnection.current = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    navigator.mediaDevices.getUserMedia({
      video: true,
      audio: {
        echoCancellation: true,     // removes speaker echo from mic
        noiseSuppression: false,    // disable to give Whisper raw, clear audio
        autoGainControl: false,     // disable to prevent audio distortion
        channelCount: 1,            // mono — WhisperX expects mono audio
        sampleRate: 16000,          // hint browser to capture at 16kHz (WhisperX rate)
      },
    }).then((stream) => {
      setLocalStream(stream);
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      stream.getTracks().forEach(t => peerConnection.current.addTrack(t, stream));

      peerConnection.current.ontrack = (e) => {
        setRemoteStream(e.streams[0]);
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = e.streams[0];
      };
      peerConnection.current.onicecandidate = (e) => {
        if (e.candidate) socketRef.current.emit("ice-candidate", { roomId, candidate: e.candidate });
      };

      let iceCandidateQueue = [];

      socketRef.current.on("offer", async ({ offer }) => {
        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(offer));
        const ans = await peerConnection.current.createAnswer();
        await peerConnection.current.setLocalDescription(ans);
        socketRef.current.emit("answer", { roomId, answer: ans });

        // Flush buffered candidates
        iceCandidateQueue.forEach(c => peerConnection.current.addIceCandidate(c).catch(console.error));
        iceCandidateQueue = [];
      });
      socketRef.current.on("answer", async ({ answer }) => {
        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));

        // Flush buffered candidates
        iceCandidateQueue.forEach(c => peerConnection.current.addIceCandidate(c).catch(console.error));
        iceCandidateQueue = [];
      });
      socketRef.current.on("ice-candidate", ({ candidate }) => {
        if (!candidate) return;
        const rtcCandidate = new RTCIceCandidate(candidate);
        if (peerConnection.current.remoteDescription) {
          peerConnection.current.addIceCandidate(rtcCandidate).catch(console.error);
        } else {
          iceCandidateQueue.push(rtcCandidate);
        }
      });
      socketRef.current.on("peer-ready", async ({ role }) => {
        if (role === "patient") {
          setPatientJoined(true);
          const offer = await peerConnection.current.createOffer();
          await peerConnection.current.setLocalDescription(offer);
          socketRef.current.emit("offer", { roomId, offer });
        }
      });
      socketRef.current.on("end-call", () => { if (!callEndedRef.current) endCall(); });

      // Signal that doctor's media is fully initialized and ready to connect
      socketRef.current.emit("media-ready", { roomId, role: "doctor" });
    }).catch(err => console.error("Media access error:", err));

    // Transcript from socket
    const handleTranscript = ({ text }) => {
      if (!text) return;
      setNotes(p => p + " " + text + " ");
    };
    socketRef.current.on("transcript", handleTranscript);

    return () => {
      ["offer", "answer", "ice-candidate", "peer-ready", "end-call", "transcript"].forEach(e => socketRef.current.off(e));
      peerConnection.current?.close();
      peerConnection.current = null;
    };
  }, [joined]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── End call ──────────────────────────────────────────────
  const endCall = async () => {
    if (callEndedRef.current) return;
    callEndedRef.current = true;
    localStream?.getTracks().forEach(t => t.stop());
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    peerConnection.current?.getSenders().forEach(s => peerConnection.current.removeTrack(s));
    peerConnection.current?.close();
    peerConnection.current = null;
    socketRef.current.emit("end-call", { roomId });
    if (document.fullscreenElement) document.exitFullscreen().catch(() => { });
    clearInterval(durationTimer.current);

    const prescriptionData = {
      patientId, patient: patientName, age: "N/A", address: "Teleconsultation", contact: "N/A",
      prescriptionNo: `RX-${Date.now()}`,
      date: new Date().toLocaleDateString(),
      email: patientEmail || "patient@clinic.com",
      medicines: medications.length > 0 ? medications : [{ name: "General Advice", dosage: "-", frequency: "-", duration: "-" }],
      notes: notes || "No additional notes",
    };

    try {
      await fetch(`${API_BASE}/prescriptions/generate`, {
        method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify(prescriptionData),
      });
      const element = document.getElementById("prescription-template-doc");
      if (element) {
        const filename = `prescription_${patientName.replace(/\s+/g, "_")}.pdf`;
        const pdfBlob = await html2pdf().set({ margin: 10, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2 }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' } }).from(element).outputPdf('blob');
        const formData = new FormData();
        formData.append("prescriptionPdf", pdfBlob, filename);
        const uploadRes = await fetch(`${API_BASE}/prescriptions/uploadPdf`, { method: "POST", headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }, body: formData });
        const uploadData = await uploadRes.json();
        if (uploadData.file) {
          await fetch(`${API_BASE}/prescriptions/send`, { method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${localStorage.getItem("token")}` }, body: JSON.stringify({ email: prescriptionData.email, file: uploadData.file }) });
        }
      }
    } catch (e) { console.error("Prescription error:", e); }

    try {
      await fetch(`${API_BASE}/api/videocall/summary`, {
        method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify({
          roomId, doctorName: name, doctorEmail: localStorage.getItem("doctorEmail"),
          startTime: callStartTime, endTime: new Date().toISOString(),
          transcription: notes, detectedCondition, medications,
        }),
      });
    } catch (e) { console.error("Summary error:", e); }

    navigate("/doctor/appointments");
  };

  const toggleMic = () => { localStream?.getAudioTracks().forEach(t => (t.enabled = !micOn)); setMicOn(p => !p); };
  const toggleCamera = () => { localStream?.getVideoTracks().forEach(t => (t.enabled = !cameraOn)); setCameraOn(p => !p); };
  const addMedication = () => {
    if (medName && dosage && frequency && duration) {
      setMedications(p => [...p, { name: medName, dosage, frequency, duration }]);
      setMedName(""); setDosage(""); setFrequency(""); setDuration("");
      setShowMedForm(false);
    }
  };

  // ── Pre-join UI ────────────────────────────────────────────
  if (!joined) {
    const joinLink = `${window.location.origin}/patient/video-call?roomId=${roomId}`;
    return (
      <Box sx={{ minHeight: "calc(100vh - 80px)", display: "flex" }}>
        {/* Left Side: Info / Branding */}
        <Box sx={{
          flex: 1,
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          justifyContent: 'center',
          p: { md: 6, lg: 10 },
          background: 'linear-gradient(135deg, #FFF3E0 0%, #FFE0B2 100%)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Decorative circles */}
          <Box sx={{ position: 'absolute', top: -100, right: -50, width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,255,255,0.5)', filter: 'blur(20px)' }} />
          <Box sx={{ position: 'absolute', bottom: -50, left: -50, width: 250, height: 250, borderRadius: '50%', background: 'rgba(255,255,255,0.5)', filter: 'blur(20px)' }} />
          
          <Typography variant="h3" sx={{ color: '#E65100', fontWeight: 800, mb: 2, zIndex: 1 }}>
            Doctor Consultation Room
          </Typography>
          <Typography variant="h6" sx={{ color: '#555', mb: 6, zIndex: 1, maxWidth: 500, lineHeight: 1.6 }}>
            Utilize integrated AI tools for automated clinical notes and prescriptions.
          </Typography>

          <Box sx={{ zIndex: 1, display: 'flex', flexDirection: 'column', gap: 3.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
              <Avatar sx={{ bgcolor: '#fff', color: '#E65100', width: 48, height: 48, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}><SmartToy/></Avatar>
              <Typography variant="body1" sx={{ color: '#333', fontWeight: 600, fontSize: '1.05rem' }}>AI Assistant transcribes continuously</Typography>
            </Box>
             <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
              <Avatar sx={{ bgcolor: '#fff', color: '#E65100', width: 48, height: 48, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}><Videocam/></Avatar>
              <Typography variant="body1" sx={{ color: '#333', fontWeight: 600, fontSize: '1.05rem' }}>AI detects visually apparent conditions</Typography>
            </Box>
             <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
              <Avatar sx={{ bgcolor: '#fff', color: '#E65100', width: 48, height: 48, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}><Mic/></Avatar>
              <Typography variant="body1" sx={{ color: '#333', fontWeight: 600, fontSize: '1.05rem' }}>Mention medicines to auto-add them</Typography>
            </Box>
          </Box>
        </Box>

        {/* Right Side: Join Form */}
        <Box sx={{
          width: { xs: '100%', md: '480px' },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#fff',
          position: 'relative',
          zIndex: 2,
          boxShadow: { md: '-20px 0 40px rgba(0,0,0,0.04)' }
        }}>
          <Paper elevation={0} sx={{
            p: { xs: 4, md: 6 },
            width: "100%",
            mx: 2,
            background: "transparent",
            color: "#1E5DA9",
          }}>

            <Box sx={{ textAlign: "center", mb: 4 }}>
              <Box sx={{
                width: 64, height: 64, borderRadius: "50%", mx: "auto", mb: 2,
                background: "linear-gradient(135deg, #62b8ffff, #1E5DA9)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 8px 24px rgba(30,93,169,0.3)"
              }}>
                <Videocam sx={{ color: "#fff", fontSize: 30 }} />
              </Box>
              <Typography variant="h5" fontWeight={800} sx={{ color: "#1E5DA9" }}>
                Start Consultation
              </Typography>
              <Typography variant="body2" sx={{ color: "#777", mt: 1 }}>
                Set up your video room below
              </Typography>
            </Box>

            <TextField fullWidth label="Doctor Name" value={name}
              onChange={e => setName(e.target.value)} sx={{ mb: 2.5, ...lightInputSx }} />

            <Box sx={{ display: "flex", gap: 1.5, mb: 2.5 }}>
              <TextField fullWidth label="Room ID" value={roomId}
                onChange={e => setRoomId(e.target.value)} sx={lightInputSx} />
              <Button variant="outlined" onClick={generateRoomId} sx={{
                minWidth: 80, borderRadius: 2, color: "#1E5DA9",
                borderColor: "rgba(0,0,0,0.15)",
                "&:hover": { borderColor: "#1E5DA9", background: "rgba(30,93,169,0.05)" },
                textTransform: "none", fontWeight: 600,
              }}>
                Generate
              </Button>
            </Box>

            {roomId && (
              <Box sx={{
                mb: 3, p: 2, borderRadius: 2,
                background: "rgba(30,93,169,0.06)",
                border: "1px solid rgba(30,93,169,0.2)",
              }}>
                <Typography sx={{ color: "#555", fontSize: "0.75rem", mb: 1 }}>
                  Patient join link
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Typography sx={{ flex: 1, color: "#1E5DA9", fontSize: "0.78rem", wordBreak: "break-all" }}>
                    {joinLink}
                  </Typography>
                  <Tooltip title={copied ? "Copied!" : "Copy link"}>
                    <IconButton onClick={copyLink} size="small" sx={{ color: copied ? "#22c55e" : "#555" }}>
                      <ContentCopy fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
                {patientEmail && (
                  <Button size="small" startIcon={<Send fontSize="small" />}
                    onClick={async () => {
                      await fetch(`${API_BASE}/email/send-video-link`, {
                        method: "POST", headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ email: patientEmail, link: joinLink, doctorName: name }),
                      });
                      alert("Link sent to patient!");
                    }}
                    sx={{
                      mt: 1, textTransform: "none", color: "#60a5fa", fontSize: "0.78rem",
                      "&:hover": { background: "rgba(96,165,250,0.1)" },
                    }}>
                    Send via email to {patientEmail}
                  </Button>
                )}
              </Box>
            )}

            <Button fullWidth variant="contained" size="large" onClick={joinRoom}
              disabled={!roomId || !name}
              sx={{
                py: 1.6, borderRadius: 2, fontWeight: 700, fontSize: "1.05rem",
                background: "linear-gradient(90deg, #62b8ffff, #1E5DA9)",
                textTransform: "none",
                boxShadow: "0 8px 24px rgba(30,93,169,0.3)",
                "&:hover": { background: "linear-gradient(90deg, #1E5DA9, #0f3f7a)", transform: "translateY(-1px)", boxShadow: "0 12px 28px rgba(30,93,169,0.4)" },
                transition: "all 0.2s ease-in-out",
                "&:disabled": { opacity: 0.5, transform: "none", boxShadow: "none" },
              }}>
              Start Video Call
            </Button>
          </Paper>
        </Box>
        <style>{globalStyles}</style>
      </Box>
    );
  }

  // ── In-call UI ─────────────────────────────────────────────
  return (
    <Box sx={{
      height: "calc(100vh - 80px)",
      display: "flex",
      background: "#f0f4f8",
      overflow: "hidden",
      gap: 0,
    }}>
      {/* ── Video Panel ── */}
      <Box
        ref={videoContainerRef}
        onMouseMove={resetControlsTimer}
        onClick={resetControlsTimer}
        sx={{
          flex: 1,
          position: "relative",
          background: "#f8fafc",
          overflow: "hidden",
          cursor: controlsVisible ? "default" : "none",
          "&:fullscreen": { background: "#000" },
          "&:-webkit-full-screen": { background: "#000" },
        }}
      >
        {/* Remote video */}
        <video ref={remoteVideoRef} autoPlay playsInline
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />

        {/* Waiting overlay */}
        {!patientJoined && (
          <Box sx={{
            position: "absolute", inset: 0,
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            pointerEvents: "none", opacity: 0.5,
          }}>
            <PersonOutline sx={{ fontSize: 80, color: "#1E5DA9" }} />
            <Typography sx={{ color: "#333", mt: 1 }}>Waiting for patient to join…</Typography>
          </Box>
        )}

        {/* Top HUD */}
        <Fade in={controlsVisible}>
          <Box sx={{
            position: "absolute", top: 0, left: 0, right: 0,
            px: 3, py: 2,
            display: "flex", alignItems: "center", justifyContent: "space-between",
            background: "linear-gradient(to bottom, rgba(255,255,255,0.9), transparent)",
          }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Box sx={{
                width: 10, height: 10, borderRadius: "50%", bgcolor: "#22c55e",
                boxShadow: "0 0 8px #22c55e",
                animation: "pulse-dot 2s ease-in-out infinite",
              }} />
              <Typography sx={{ color: "#1E5DA9", fontWeight: 600, fontSize: "0.95rem" }}>
                Doctor room · {roomId}
              </Typography>
            </Box>
            <Box sx={{
              px: 2, py: 0.5, borderRadius: 99,
              background: "rgba(255,255,255,0.9)", backdropFilter: "blur(8px)",
              border: "1px solid rgba(0,0,0,0.1)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
            }}>
              <Typography sx={{ color: "#333", fontSize: "0.85rem", fontVariantNumeric: "tabular-nums" }}>
                ⏱ {formatDuration(callDuration)}
              </Typography>
            </Box>
          </Box>
        </Fade>

        {/* Local PiP */}
        <Box sx={{
          position: "absolute", bottom: 100, right: 16,
          borderRadius: "16px", overflow: "hidden",
          border: "2px solid #1E5DA9",
          boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
          width: { xs: 100, sm: 150 }, height: { xs: 68, sm: 100 },
          transition: "all 0.3s", "&:hover": { transform: "scale(1.04)" },
          background: "#fff",
        }}>
          <video ref={localVideoRef} autoPlay muted playsInline
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          {!cameraOn && (
            <Box sx={{
              position: "absolute", inset: 0, bgcolor: "#f0f4f8",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <VideocamOff sx={{ color: "rgba(30,93,169,0.5)" }} />
            </Box>
          )}
          <Box sx={{
            position: "absolute", bottom: 4, left: 0, right: 0,
            textAlign: "center",
          }}>
            <Typography sx={{ color: "#1E5DA9", fontSize: "0.62rem", fontWeight: "bold", textShadow: "0 1px 2px rgba(255,255,255,0.8)" }}>
              You (Dr. {name})
            </Typography>
          </Box>
        </Box>

        {/* Control bar */}
        <Fade in={controlsVisible}>
          <Box sx={{
            position: "absolute", bottom: 24, left: "50%",
            transform: "translateX(-50%)",
            display: "flex", alignItems: "center", gap: 1.5,
            px: 3, py: 1.5, borderRadius: "100px",
            background: "rgba(255,255,255,0.9)",
            backdropFilter: "blur(16px)",
            border: "1px solid rgba(0,0,0,0.1)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
          }}>
            <Tooltip title={micOn ? "Mute" : "Unmute"} placement="top">
              <IconButton onClick={toggleMic} sx={controlBtnSx(micOn)}>
                {micOn ? <Mic /> : <MicOff />}
              </IconButton>
            </Tooltip>
            <Tooltip title={cameraOn ? "Stop camera" : "Start camera"} placement="top">
              <IconButton onClick={toggleCamera} sx={controlBtnSx(cameraOn)}>
                {cameraOn ? <Videocam /> : <VideocamOff />}
              </IconButton>
            </Tooltip>
            <Box sx={{ width: 1, height: 36, bgcolor: "rgba(0,0,0,0.1)", mx: 0.5 }} />
            <Tooltip title={isFullscreen ? "Exit fullscreen" : "Fullscreen"} placement="top">
              <IconButton onClick={toggleFullscreen} sx={controlBtnSx(true)}>
                {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
              </IconButton>
            </Tooltip>
            <Box sx={{ width: 1, height: 36, bgcolor: "rgba(0,0,0,0.1)", mx: 0.5 }} />
            <Tooltip title="End call" placement="top">
              <IconButton onClick={endCall} sx={{
                color: "#fff", width: 56, height: 56,
                background: "linear-gradient(135deg, #ef4444, #dc2626)",
                boxShadow: "0 4px 20px rgba(239,68,68,0.5)",
                "&:hover": { background: "linear-gradient(135deg, #dc2626, #b91c1c)", transform: "scale(1.08)" },
                transition: "all 0.2s",
              }}>
                <CallEnd />
              </IconButton>
            </Tooltip>
          </Box>
        </Fade>
      </Box>

      {/* ── Right Panel (Prescription + AI) ── */}
      <Box sx={{
        width: 360,
        display: "flex",
        flexDirection: "column",
        background: "#ffffff",
        borderLeft: "1px solid rgba(0,0,0,0.07)",
        overflow: "hidden",
      }}>
        {/* Panel header */}
        <Box sx={{
          px: 2.5, py: 2,
          borderBottom: "1px solid rgba(0,0,0,0.07)",
          background: "#f8fafc",
        }}>
          <Typography variant="subtitle1" fontWeight={700} sx={{ color: "#1E5DA9" }}>
            📋 Prescription Generator
          </Typography>
          {detectedCondition && (
            <Chip
              label={`Condition: ${detectedCondition}`}
              size="small"
              sx={{ mt: 0.5, background: "rgba(30,93,169,0.1)", color: "#1E5DA9", fontSize: "0.7rem" }}
            />
          )}
        </Box>

        {/* Scrollable content */}
        <Box sx={{ flex: 1, overflowY: "auto", px: 2.5, py: 2, "&::-webkit-scrollbar": { width: 4 }, "&::-webkit-scrollbar-thumb": { background: "rgba(0,0,0,0.15)", borderRadius: 4 } }}>

          {/* Medications list */}
          {medications.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" sx={{ color: "#888", textTransform: "uppercase", letterSpacing: 1, fontSize: "0.68rem" }}>
                Medications ({medications.length})
              </Typography>
              {medications.map((med, i) => (
                <Box key={i} sx={{
                  mt: 1, p: 1.5, borderRadius: 2,
                  background: "#E3F2FD",
                  border: "1px solid rgba(30,93,169,0.1)",
                  display: "flex", alignItems: "center", gap: 1.5,
                }}>
                  <Avatar sx={{ width: 32, height: 32, fontSize: "0.75rem", bgcolor: "#1E5DA9", flexShrink: 0 }}>
                    {med.name?.[0]?.toUpperCase()}
                  </Avatar>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ color: "#1E5DA9", fontWeight: 600, fontSize: "0.85rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {med.name}
                    </Typography>
                    <Typography sx={{ color: "#555", fontSize: "0.72rem" }}>
                      {[med.dosage, med.frequency, med.duration].filter(Boolean).join(" · ")}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          )}

          {/* Add medication button */}
          <Button
            fullWidth
            variant="outlined"
            size="small"
            startIcon={<Add />}
            onClick={() => setShowMedForm(p => !p)}
            sx={{
              mb: 1.5, borderRadius: 2, textTransform: "none",
              color: "#1E5DA9",
              borderColor: "rgba(30,93,169,0.3)",
              "&:hover": { borderColor: "#1E5DA9", background: "rgba(30,93,169,0.08)" },
            }}
          >
            {showMedForm ? "Close form" : "Add Medication"}
          </Button>

          <Collapse in={showMedForm}>
            <Box sx={{ mb: 2, display: "flex", flexDirection: "column", gap: 1.5 }}>
              {[
                { label: "Medicine Name", value: medName, set: setMedName },
                { label: "Dosage (e.g. 500mg)", value: dosage, set: setDosage },
                { label: "Frequency (e.g. 3x daily)", value: frequency, set: setFrequency },
                { label: "Duration (e.g. 7 days)", value: duration, set: setDuration },
              ].map(({ label, value, set }) => (
                <TextField key={label} fullWidth size="small" label={label}
                  value={value} onChange={e => set(e.target.value)}
                  sx={lightInputSx} />
              ))}
              <Button fullWidth variant="contained" size="small" onClick={addMedication}
                disabled={!medName || !dosage || !frequency || !duration}
                sx={{
                  borderRadius: 2, textTransform: "none", fontWeight: 600,
                  background: "linear-gradient(90deg, #62b8ffff, #1E5DA9)",
                  "&:hover": { background: "linear-gradient(90deg, #1E5DA9, #0f3f7a)" },
                  "&:disabled": { opacity: 0.4 },
                }}>
                Add to Prescription
              </Button>
            </Box>
          </Collapse>

          {/* Notes & Actions */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" sx={{ color: "#888", textTransform: "uppercase", letterSpacing: 1, fontSize: "0.68rem" }}>
              Consultation Notes
            </Typography>
            <TextField
              fullWidth multiline rows={4} placeholder="Notes from transcript will appear here…"
              value={notes} onChange={e => setNotes(e.target.value)}
              sx={{ mt: 1, mb: 1.5, ...lightInputSx }}
            />
            {/* Live Actions */}
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              <Button size="small" variant="contained" startIcon={<Save fontSize="small" />} onClick={handleSavePrescription}
                sx={{ flexGrow: 1, background: "#1E5DA9", textTransform: "none", boxShadow: "none" }}>
                Generate
              </Button>
              <Button size="small" variant="outlined" startIcon={<Visibility fontSize="small" />} onClick={() => setPreviewOpen(true)}
                sx={{ flexGrow: 1, textTransform: "none", color: "#1E5DA9", borderColor: "rgba(30,93,169,0.3)" }}>
                Preview
              </Button>
              <Button size="small" variant="outlined" startIcon={<Download fontSize="small" />} onClick={handleDownload}
                sx={{ flexGrow: 1, textTransform: "none", borderColor: "rgba(30,93,169,0.3)" }}>
                Download
              </Button>
              {patientEmail && (
                <Button size="small" variant="contained" color="secondary" startIcon={<Email fontSize="small" />} onClick={handleSendEmail}
                  sx={{ width: "100%", textTransform: "none", background: "linear-gradient(135deg, #10b981, #059669)", boxShadow: "none" }}>
                  Email to Patient
                </Button>
              )}
            </Box>
          </Box>

          {/* AI Panel */}
          <Divider sx={{ borderColor: "rgba(0,0,0,0.07)", mb: 2 }} />
          <Box sx={{
            p: 1.5, borderRadius: 2,
            background: "rgba(30,93,169,0.04)",
            border: "1px solid rgba(30,93,169,0.15)",
          }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
              <SmartToy sx={{ color: "#1E5DA9", fontSize: 18 }} />
              <Typography variant="caption" sx={{ color: "#1E5DA9", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, fontSize: "0.7rem" }}>
                AI Assistant
              </Typography>
            </Box>
            <AiPanel
              localStream={localStream}
              remoteStream={remoteStream}
              active={joined && patientJoined}
              sessionId={roomId}
              patientId={queryParams.get("patientId") || "patient_101"}
              doctorId={doctorId}
              liveTranscript={notes}
              onMedicinesFound={handleAiMedicines}
            />
          </Box>
        </Box>
      </Box>

      {/* ── Live Preview Modal ── */}
      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 4, background: "#f4f7fb" } }}>
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontWeight: "bold", color: "#1E5DA9" }}>
          E-Prescription Live Preview
          <Button onClick={() => setPreviewOpen(false)} sx={{ color: "#888", textTransform: "none", fontWeight: 600 }}>Close Preview</Button>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0 }}>
          <PrescriptionTemplate prescription={prescriptionPreviewData} />
        </DialogContent>
        <DialogActions sx={{ p: 2, background: "#fff" }}>
          <Button variant="contained" onClick={handleSavePrescription} startIcon={<Save />} sx={{ textTransform: "none", background: "#1E5DA9" }}>Generate Securely</Button>
          <Button variant="outlined" onClick={handleDownload} startIcon={<Download />} sx={{ textTransform: "none" }}>Download PDF</Button>
          {patientEmail && <Button variant="contained" color="secondary" onClick={handleSendEmail} startIcon={<Email />} sx={{ textTransform: "none", background: "linear-gradient(135deg, #10b981, #059669)" }}>Email to Patient</Button>}
        </DialogActions>
      </Dialog>

      {/* ── Auto-Serializer Hidden Element ── */}
      <Box sx={{ position: "absolute", top: "-9999px", left: "-9999px", width: "800px", zIndex: -1 }}>
        <PrescriptionTemplate prescription={prescriptionPreviewData} />
      </Box>

      <style>{globalStyles}</style>
    </Box>
  );
};

// ── Shared styles ────────────────────────────────────────────
const lightInputSx = {
  "& .MuiOutlinedInput-root": {
    color: "#333",
    borderRadius: 2,
    background: "rgba(255,255,255,0.6)",
    "& fieldset": { borderColor: "rgba(0,0,0,0.15)" },
    "&:hover fieldset": { borderColor: "rgba(0,0,0,0.3)" },
    "&.Mui-focused fieldset": { borderColor: "#1E5DA9" },
    "& textarea, & input": { color: "#333" },
  },
  "& .MuiInputLabel-root": { color: "#555" },
  "& .MuiInputLabel-root.Mui-focused": { color: "#1E5DA9" },
};

const controlBtnSx = (active) => ({
  color: active ? "#1E5DA9" : "#fff",
  width: 52,
  height: 52,
  background: active ? "rgba(30,93,169,0.1)" : "rgba(239,68,68,0.9)",
  "&:hover": { background: active ? "rgba(30,93,169,0.2)" : "rgba(239,68,68,1)" },
  transition: "all 0.2s",
});

const globalStyles = `
  @keyframes pulse-dot {
    0%, 100% { opacity: 1; transform: scale(1); }
    50%       { opacity: 0.6; transform: scale(1.3); }
  }
`;

export default VideoCall;
