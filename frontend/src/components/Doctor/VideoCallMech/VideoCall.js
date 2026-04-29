import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  Box, Typography, Paper, IconButton, Button, TextField,
  Divider, Tooltip, Fade, Chip, Avatar, Collapse,
  Dialog, DialogTitle, DialogContent, DialogActions, Autocomplete
} from "@mui/material";
import {
  MicOff, Mic, Videocam, VideocamOff, CallEnd,
  Fullscreen, FullscreenExit, ContentCopy, Send,
  Add, PersonOutline, SmartToy, Download, Email, Save, Visibility, Description,
} from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";
import { io } from "socket.io-client";
import AiPanel from "./AiPanel";
import PrescriptionTemplate from "../Dashboard/PrescriptionTemplate";
import html2pdf from "html2pdf.js";

const COMMON_MEDICINES = [
  "Paracetamol (500mg)", "Ibuprofen (400mg)", "Amoxicillin (500mg)", "Azithromycin (500mg)", "Ciprofloxacin (500mg)",
  "Metformin (500mg)", "Atorvastatin (10mg)", "Amlodipine (5mg)", "Omeprazole (20mg)", "Pantoprazole (40mg)",
  "Cetirizine (10mg)", "Loratadine (10mg)", "Montelukast (10mg)", "Salbutamol Inhaler", "Aspirin (75mg)",
  "Clopidogrel (75mg)", "Losartan (50mg)", "Telmisartan (40mg)", "Levothyroxine (50mcg)", "Vitamin D3 (60K IU)",
  "Vitamin C (500mg)", "Zinc (50mg)", "B-Complex", "Iron Supplement", "Calcium (500mg)"
];

const VideoCall = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const socketRef = useRef(null);
  const queryParams = new URLSearchParams(location.search);
  const [roomId, setRoomId] = useState(queryParams.get("roomId") || "");
  const [patientEmail, setPatientEmail] = useState(queryParams.get("patientEmail") || "");
  const [patientName, setPatientName] = useState(queryParams.get("patientName") || "Patient");
  const [patientId, setPatientId] = useState(queryParams.get("patientId") || "202");
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
  const [inLobby, setInLobby] = useState(true);
  const [lobbyStatus, setLobbyStatus] = useState({ doctorPresent: false, patientPresent: false });
  const [mediaReady, setMediaReady] = useState(false);
  const [isMediaLoading, setIsMediaLoading] = useState(false);

  // Prescription state
  const [medications, setMedications] = useState([]);
  const [suggestedMeds, setSuggestedMeds] = useState([]);
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
  const [connectedPatientName, setConnectedPatientName] = useState("");
  const [leftMessage, setLeftMessage] = useState("");
  const [patientDetails, setPatientDetails] = useState({ age: "", gender: "", phone: "", address: "" });
  const [prescriptionGuidelines, setPrescriptionGuidelines] = useState([]);
  const [patientReports, setPatientReports] = useState([]);

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

  // ── Fetch patient profile from backend ──────────────────────
  const fetchPatientProfile = async (pid) => {
    if (!pid) return;
    try {
      const res = await fetch(`${API_BASE}/patient/profile/${pid}`);
      if (res.ok) {
        const data = await res.json();
        setPatientDetails({
          age: data.age || "",
          gender: data.gender || "",
          phone: data.phone || "",
          address: data.address || ""
        });
        if (data.name) setPatientName(data.name);
        if (data.email) setPatientEmail(data.email);
        if (data.patientId) setPatientId(data.patientId.toString());

        // Fetch reports too
        const reportsRes = await fetch(`${API_BASE}/patient/reports/${pid}`);
        if (reportsRes.ok) {
          const reportsData = await reportsRes.json();
          setPatientReports(reportsData);
        }
      }
    } catch (e) {
      console.error("Failed to fetch patient profile:", e);
    }
  };

  useEffect(() => {
    if (patientId) {
      fetchPatientProfile(patientId);
    }
  }, [patientId]);

  // ── Manual E-Prescription Actions ────────────────────────────
  const activePatientName = patientName;
  const activePatientId = patientId;

  const prescriptionPreviewData = {
    doctor: name,
    specialization: "General Medicine",
    license: "MED-CLINIC-X",
    patient: activePatientName,
    patientId: activePatientId,
    age: patientDetails.age || "",
    gender: patientDetails.gender || "",
    diagnosis: detectedCondition || (notes && notes.length > 20 ? notes.trim().split(/[.!?]/).filter(s => s.trim().length > 10).pop() || notes.substring(0, 100) : "Consultation in progress"),
    medicines: medications.filter(m => m.name.trim() !== ""),
    guidelines: prescriptionGuidelines.length > 0 ? prescriptionGuidelines : (notes && notes.length > 50 ? ["Follow-up as advised during call", "Maintain hydration"] : []),
    nextVisit: "TBD"
  };

  const handleSavePrescription = async () => {
    const filename = `prescription_${activePatientName.replace(/\s+/g, "_")}.pdf`;
    const pData = {
      patientId: activePatientId, patient: activePatientName, age: "N/A", address: "Teleconsultation", contact: "N/A",
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

  const [sendingEmail, setSendingEmail] = useState(false);

  const handleSendToPatient = async () => {
    let targetEmail = patientEmail;

    // If no email from query params, prompt the user
    if (!targetEmail || targetEmail === "null" || targetEmail === "undefined") {
      const manualEmail = prompt("Patient email is missing. Please enter the recipient's email address:", "");
      if (!manualEmail) {
        alert("Email is required to send the prescription.");
        return;
      }
      targetEmail = manualEmail;
    }

    setSendingEmail(true);
    const filename = `prescription_${activePatientName.replace(/\s+/g, "_")}.pdf`;

    // First save the PDF to server if not already done
    await handleSavePrescription();

    const deliveryData = {
      email: targetEmail,
      patient: activePatientName,
      patientId: activePatientId,
      diagnosis: prescriptionPreviewData.diagnosis,
      medicines: prescriptionPreviewData.medicines,
      guidelines: prescriptionPreviewData.guidelines,
      nextVisit: prescriptionPreviewData.nextVisit,
      doctorId: localStorage.getItem("doctorId"),
      doctorName: name, // From current session state
      appointmentId: roomId,
      file: filename
    };

    try {
      const res = await fetch(`${API_BASE}/prescriptions/save-and-send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify(deliveryData)
      });

      if (res.ok) {
        alert(`Prescription successfully saved to records and sent to ${deliveryData.email}!`);
        setPreviewOpen(false);

        // ── Mark Appointment as Completed ──
        fetch(`${API_BASE}/appointment/complete/${roomId}`, {
          method: "PUT",
          headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
        }).catch(err => console.error("Failed to mark appointment as complete:", err));

      } else {
        throw new Error("Delivery failed");
      }
    } catch (err) {
      alert("Error sending prescription. Please try again.");
      console.error(err);
    } finally {
      setSendingEmail(false);
    }
  };

  // ── Socket init (Connect ONCE) ────────────────────────────
  useEffect(() => {
    socketRef.current = io("http://localhost:8000", { transports: ["websocket"] });
    
    socketRef.current.on("lobby-status", (status) => {
      console.log("[Doctor] Lobby status update:", status);
      setLobbyStatus(status);
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, []); // Empty dependency array: connects exactly once

  // ── Handle Lobby Join/Leave Dynamically ───────────────────
  useEffect(() => {
    if (!socketRef.current) return;

    // Send an immediate join
    if (roomId && name && inLobby) {
      socketRef.current.emit("lobby-join", { roomId, role: "doctor", userName: name });
    }

    // Robust Polling: Every 2 seconds, re-assert our presence in the room.
    // This completely eliminates any missing events or desyncs.
    const interval = setInterval(() => {
      if (roomId && name && inLobby && socketRef.current && socketRef.current.connected) {
        socketRef.current.emit("lobby-ping", { roomId, role: "doctor", userName: name });
      }
    }, 2000);

    return () => {
      clearInterval(interval);
      if (roomId && socketRef.current && socketRef.current.connected) {
        socketRef.current.emit("lobby-leave", { roomId, role: "doctor" });
      }
    };
  }, [roomId, name, inLobby]);

  // ── Media Permissions Request ──────────────────────────────
  const handleRequestPermissions = async () => {
    setIsMediaLoading(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      // We got the stream! This confirms permissions are granted.
      // But user doesn't want the camera ON in the lobby, so we stop it immediately.
      stream.getTracks().forEach(track => track.stop());
      setMediaReady(true);
    } catch (err) {
      console.error("Media permission denied:", err);
      alert("Please grant camera and microphone permissions to proceed.");
    } finally {
      setIsMediaLoading(false);
    }
  };

  // ── Media Preview ───────────────────────────────────────────
  // Automatically start preview ONLY IF mediaReady is true (meaning they clicked the button)
  // But per user request "don't want video camera to be on to check lobby", 
  // we will NOT show the video preview at all in the lobby.
  /*
  useEffect(() => {
    if (inLobby && !localStream && mediaReady) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(stream => { 
          setLocalStream(stream); 
          if (localVideoRef.current) localVideoRef.current.srcObject = stream; 
        })
        .catch(console.error);
    }
  }, [inLobby, localStream, mediaReady]);
  */

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
      .map(m => ({
        name: m.metadata.drug_name,
        dosage: m.metadata.dosage || "Standard Dose",
        frequency: m.metadata.frequency || "2x daily (After meals)",
        duration: m.metadata.duration || "5 Days"
      }));
    setSuggestedMeds(prev => {
      const existing = new Set(prev.map(p => p.name?.toLowerCase()));
      return [...prev, ...newMeds.filter(m => !existing.has(m.name.toLowerCase()))];
    });
  }, []); // no deps — only uses setSuggestedMeds (stable setter)

  const handleSelectAiMedicine = useCallback((med) => {
    if (!med || !med.metadata) return;
    const name = med.metadata.drug_name || "Unknown Medicine";
    const dosage = med.metadata.dosage || "Standard Dose";
    const freq = med.metadata.frequency || "2x daily (After meals)";
    const dur = med.metadata.duration || "5 Days";
    const note = med.metadata.comment || med.metadata.indications || "";

    setMedications(prev => {
      const exists = prev.find(m => m.name?.toLowerCase() === name.toLowerCase());
      if (exists) return prev;
      return [...prev, { name, dosage, frequency: freq, duration: dur, note }];
    });

    // Also remove from suggested if it was there
    setSuggestedMeds(prev => prev.filter(p => p.name?.toLowerCase() !== name.toLowerCase()));
  }, []);

  // ── Auto-generate guidelines when medications change ──────
  useEffect(() => {
    if (medications.length > 0) {
      // Use the RAG API base (port 5000 via proxy 8000 might be needed, but RAG API runs on 5000 directly)
      // Actually, VideoCall.js uses API_BASE = "http://localhost:8000" which proxies /rag/* to 5000.
      fetch(`${API_BASE}/rag/prescription-guidelines`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ medications })
      })
        .then(res => res.json())
        .then(data => {
          if (data.guidelines) setPrescriptionGuidelines(data.guidelines);
        })
        .catch(err => console.error("Failed to fetch guidelines:", err));
    } else {
      setPrescriptionGuidelines([]);
    }
  }, [medications, API_BASE]);

  const handleSelectSuggestion = (med) => {
    setMedName(med.name);
    setDosage(med.dosage || "");
    setFrequency(med.frequency || "");
    setDuration(med.duration || "");
    setShowMedForm(true);
    setSuggestedMeds(prev => prev.filter(m => m.name !== med.name));
  };

  // ── Join ───────────────────────────────────────────────────
  const joinRoom = async () => {
    if (joined) return;
    if (!roomId || !name) { alert("Please enter Room ID and Name"); return; }
    
    // Signal to the server that the call has officially started
    // This will trigger the auto-join for the patient
    socketRef.current.emit("lobby-start-call", { roomId });
    
    socketRef.current.emit("join-room", { roomId });
    setJoined(true);
    setInLobby(false);
    setCallStartTime(new Date().toISOString());
  };

  // ── Auto-Join when both in Lobby ───────────────────────────
  // REMOVED for manual start control per user request
  /*
  useEffect(() => {
    if (inLobby && !joined && lobbyStatus.doctorPresent && lobbyStatus.patientPresent && roomId && name) {
      const timer = setTimeout(() => {
        joinRoom();
      }, 1500); 
      return () => clearTimeout(timer);
    }
  }, [inLobby, joined, lobbyStatus, roomId, name]);
  */

  // ── WebRTC ─────────────────────────────────────────────────
  useEffect(() => {
    if (!joined) return;

    let iceCandidateQueue = [];
    let localMediaStream = null;

    // Helper: build a fresh RTCPeerConnection and wire it up
    const buildPC = (stream) => {
      // Tear down old connection if it exists
      if (peerConnection.current) {
        peerConnection.current.ontrack = null;
        peerConnection.current.onicecandidate = null;
        try { peerConnection.current.close(); } catch (_) { }
      }

      const pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });

      stream.getTracks().forEach(t => pc.addTrack(t, stream));

      pc.ontrack = (e) => {
        setRemoteStream(e.streams[0]);
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = e.streams[0];
      };
      pc.onicecandidate = (e) => {
        if (e.candidate) socketRef.current.emit("ice-candidate", { roomId, candidate: e.candidate });
      };

      peerConnection.current = pc;
      iceCandidateQueue = [];
      return pc;
    };

    navigator.mediaDevices.getUserMedia({
      video: true,
      audio: {
        echoCancellation: true,
        noiseSuppression: false,
        autoGainControl: false,
        channelCount: 1,
        sampleRate: 16000,
      },
    }).then((stream) => {
      localMediaStream = stream;
      setLocalStream(stream);
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;

      // Build the initial peer connection
      buildPC(stream);

      socketRef.current.on("offer", async ({ offer }) => {
        if (!peerConnection.current || peerConnection.current.signalingState === "closed") buildPC(localMediaStream);
        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(offer));
        const ans = await peerConnection.current.createAnswer();
        await peerConnection.current.setLocalDescription(ans);
        socketRef.current.emit("answer", { roomId, answer: ans });

        iceCandidateQueue.forEach(c => peerConnection.current.addIceCandidate(c).catch(console.error));
        iceCandidateQueue = [];
      });
      socketRef.current.on("answer", async ({ answer }) => {
        if (peerConnection.current && peerConnection.current.signalingState === "have-local-offer") {
          await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));
          iceCandidateQueue.forEach(c => peerConnection.current.addIceCandidate(c).catch(console.error));
          iceCandidateQueue = [];
        }
      });
      socketRef.current.on("ice-candidate", ({ candidate }) => {
        if (!candidate) return;
        const rtcCandidate = new RTCIceCandidate(candidate);
        if (peerConnection.current && peerConnection.current.remoteDescription) {
          peerConnection.current.addIceCandidate(rtcCandidate).catch(console.error);
        } else {
          iceCandidateQueue.push(rtcCandidate);
        }
      });
      socketRef.current.on("peer-ready", async ({ role, userName, patientId: pid }) => {
        if (role === "patient") {
          setPatientJoined(true);
          setConnectedPatientName(userName || "Patient");
          setLeftMessage("");
          setMedications([]);
          setSuggestedMeds([]);
          setNotes("");
          setDetectedCondition("");
          setPatientDetails({ age: "", gender: "", phone: "", address: "" });

          // Fetch full patient profile from backend
          if (pid) fetchPatientProfile(pid);

          // Use the existing peer connection, do NOT rebuild it
          if (peerConnection.current) {
            try {
              const offer = await peerConnection.current.createOffer();
              await peerConnection.current.setLocalDescription(offer);
              socketRef.current.emit("offer", { roomId, offer });
            } catch (err) {
              console.error("Error creating offer:", err);
            }
          }
        }
      });
      socketRef.current.on("user-left", ({ role, userName }) => {
        if (role === "patient") {
          setPatientJoined(false);
          setLeftMessage(`${userName || "Patient"} has left the call`);
          if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
          setRemoteStream(null);
        }
      });

      // Signal that doctor's media is fully initialized and ready to connect
      socketRef.current.emit("media-ready", { roomId, role: "doctor", userName: name });
    }).catch(err => console.error("Media access error:", err));

    return () => {
      ["offer", "answer", "ice-candidate", "peer-ready", "user-left"].forEach(e => socketRef.current.off(e));
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
    socketRef.current.emit("user-left", { roomId, role: "doctor", userName: name });
    if (document.fullscreenElement) document.exitFullscreen().catch(() => { });
    clearInterval(durationTimer.current);

    // ── Mark Appointment as Completed ──
    try {
      await fetch(`${API_BASE}/appointment/complete/${roomId}`, {
        method: "PUT",
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
    } catch (e) { console.error("Failed to mark appointment as complete:", e); }

    // Prompt to send prescription if not already sent
    if (medications.length > 0 && !callEndedRef.current) {
      if (window.confirm("Consultation ended. Would you like to send the prescription to the patient now?")) {
        await handleSendToPatient();
      }
    }

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
  // ── Pre-join / Lobby Screen ──────────────────────────────────
  if (inLobby || !joined) {
    const joinLink = `${window.location.origin}/patient/video-call?roomId=${roomId}`;
    return (
      <Box sx={{ minHeight: "calc(100vh - 80px)", display: "flex", flexDirection: { xs: 'column', md: 'row' }, bgcolor: "#f8fafc" }}>
        {/* Left Side: Media Preview */}
        <Box sx={{
          flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', p: { xs: 2, sm: 4 },
          background: 'linear-gradient(135deg, #f0f4f8 0%, #f8fafc 100%)',
          position: 'relative', overflow: 'hidden'
        }}>
          <Typography variant="h4" fontWeight="800" sx={{ color: "#1E5DA9", mb: { xs: 2, md: 4 }, zIndex: 1, textAlign: "center", fontSize: { xs: "1.75rem", md: "2.125rem" } }}>Consultation Lobby</Typography>
          
          <Paper sx={{ 
            width: "100%", maxWidth: 640, aspectRatio: "16/9", bgcolor: "#1a1a1a", borderRadius: 4, overflow: "hidden", position: "relative",
            boxShadow: "0 20px 40px rgba(0,0,0,0.2)", zIndex: 1,
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center"
          }}>
            {mediaReady ? (
              <Box sx={{ textAlign: "center", animation: "fadeIn 0.5s ease-in" }}>
                <Avatar sx={{ width: 120, height: 120, bgcolor: "rgba(30,93,169,0.1)", border: "2px solid #1E5DA9", mb: 3, mx: "auto" }}>
                  <PersonOutline sx={{ fontSize: 60, color: "#1E5DA9" }} />
                </Avatar>
                <Typography variant="h6" sx={{ color: "#fff", mb: 1 }}>Media Devices Ready</Typography>
                <Box sx={{ display: "flex", gap: 1, justifyContent: "center" }}>
                   <Chip size="small" icon={<Mic sx={{ fontSize: "1rem !important" }} />} label="Microphone Active" sx={{ bgcolor: "rgba(34,197,94,0.2)", color: "#4ade80", border: "1px solid #16a34a" }} />
                   <Chip size="small" icon={<Videocam sx={{ fontSize: "1rem !important" }} />} label="Camera Active" sx={{ bgcolor: "rgba(34,197,94,0.2)", color: "#4ade80", border: "1px solid #16a34a" }} />
                </Box>
              </Box>
            ) : (
              <Box sx={{ textAlign: "center", p: 4 }}>
                <Avatar sx={{ width: 100, height: 100, bgcolor: "rgba(255,255,255,0.05)", mb: 3, mx: "auto" }}>
                  <VideocamOff sx={{ fontSize: 50, color: "rgba(255,255,255,0.3)" }} />
                </Avatar>
                <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.6)", mb: 4, maxWidth: 300 }}>
                  Camera and Microphone are currently off for your privacy.
                </Typography>
                <Button 
                  variant="contained" 
                  onClick={handleRequestPermissions} 
                  disabled={isMediaLoading}
                  sx={{ 
                    bgcolor: "#1E5DA9", borderRadius: 2, px: 4, py: 1.5,
                    "&:hover": { bgcolor: "#154a8a" }
                  }}
                >
                  {isMediaLoading ? "Checking..." : "Enable Camera & Mic"}
                </Button>
              </Box>
            )}
            
            {/* Minimal overlays for lobby */}
            {mediaReady && (
              <Box sx={{ position: "absolute", bottom: 20, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 2 }}>
                <Tooltip title={micOn ? "Mute Mic" : "Unmute Mic"}>
                  <IconButton onClick={() => setMicOn(!micOn)} 
                    sx={{ bgcolor: micOn ? "rgba(255,255,255,0.1)" : "rgba(239,68,68,0.2)", color: micOn ? "#fff" : "#ef4444" }}>
                    {micOn ? <Mic /> : <MicOff />}
                  </IconButton>
                </Tooltip>
                <Tooltip title={cameraOn ? "Turn off Camera" : "Turn on Camera"}>
                  <IconButton onClick={() => setCameraOn(!cameraOn)} 
                    sx={{ bgcolor: cameraOn ? "rgba(255,255,255,0.1)" : "rgba(239,68,68,0.2)", color: cameraOn ? "#fff" : "#ef4444" }}>
                    {cameraOn ? <Videocam /> : <VideocamOff />}
                  </IconButton>
                </Tooltip>
              </Box>
            )}
          </Paper>

          <Box sx={{ mt: 4, p: 3, bgcolor: "rgba(30,93,169,0.05)", borderRadius: 4, border: "1px solid rgba(30,93,169,0.1)", textAlign: "center", maxWidth: 400, width: "100%" }}>
             <Typography variant="subtitle1" fontWeight="700" color="#1E5DA9" gutterBottom>Lobby Status</Typography>
             <Box sx={{ display: "flex", justifyContent: "space-around", mb: 2 }}>
                <Box>
                   <Typography variant="caption" display="block" color="#777">Doctor</Typography>
                   <Chip label="Ready" color="success" size="small" />
                </Box>
                <Box>
                   <Typography variant="caption" display="block" color="#777">Patient</Typography>
                   <Chip 
                     label={lobbyStatus.patientPresent ? "Ready" : "Waiting..."} 
                     color={lobbyStatus.patientPresent ? "success" : "default"} 
                     variant={lobbyStatus.patientPresent ? "filled" : "outlined"}
                     size="small" 
                   />
                </Box>
             </Box>
             <Typography variant="body2" color="#555" sx={{ mb: 2 }}>
               {lobbyStatus.patientPresent 
                 ? "Patient is in the lobby. You can start the consultation." 
                 : "Waiting for the patient to join the lobby..."}
             </Typography>
          </Box>
        </Box>

        {/* Right Side: Join Controls */}
        <Box sx={{ width: { xs: '100%', md: '440px' }, display: "flex", flexDirection: "column", justifyContent: "center", p: { xs: 3, sm: 6 }, bgcolor: "#fff", borderLeft: { xs: 'none', md: '1px solid #eee' }, borderTop: { xs: '1px solid #eee', md: 'none' }, zIndex: 2 }}>
          <Typography variant="h5" fontWeight="800" sx={{ color: "#1E5DA9", mb: 1 }}>Start Consultation</Typography>
          <Typography variant="body2" sx={{ color: "#777", mb: 4 }}>Both participants must be in the lobby to start.</Typography>

          <TextField fullWidth label="Your Display Name" value={name} onChange={e => setName(e.target.value)} sx={{ mb: 2.5, ...lightInputSx }} />
          
          <Box sx={{ display: "flex", gap: 1.5, mb: 4 }}>
            <TextField fullWidth label="Room ID" value={roomId} onChange={e => setRoomId(e.target.value)} sx={lightInputSx} />
            <Button variant="outlined" onClick={generateRoomId} sx={{ minWidth: 80, borderRadius: 2, color: "#1E5DA9", borderColor: "rgba(30,93,169,0.3)" }}>
              New
            </Button>
          </Box>

          <Button 
            fullWidth variant="contained" size="large" onClick={joinRoom} disabled={!roomId || !name || !lobbyStatus.patientPresent || !mediaReady}
            sx={{ py: 2, borderRadius: 2, fontWeight: 700, background: "linear-gradient(135deg, #62b8ffff, #1E5DA9)", boxShadow: "0 8px 20px rgba(30,93,169,0.2)", "&:disabled": { opacity: 0.6 } }}
          >
            {!mediaReady ? "Enable Media to Start" : (lobbyStatus.patientPresent ? "Start Video Consultation" : "Waiting for Patient...")}
          </Button>

          <Box sx={{ mt: 4, p: 2, bgcolor: "#f1f5f9", borderRadius: 3 }}>
            <Typography variant="caption" fontWeight="700" sx={{ color: "#64748b", mb: 1, display: "block" }}>Quick Invite Link</Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <TextField fullWidth size="small" value={joinLink} InputProps={{ readOnly: true, sx: { fontSize: "0.75rem", bgcolor: "#fff" } }} />
              <IconButton size="small" onClick={() => { navigator.clipboard.writeText(joinLink); setCopied(true); setTimeout(() => setCopied(false), 2000); }}>
                <ContentCopy fontSize="small" color={copied ? "success" : "inherit"} />
              </IconButton>
            </Box>
          </Box>
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
      flexDirection: { xs: "column", lg: "row" },
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
          flex: { xs: "none", lg: 1 },
          height: { xs: "45vh", sm: "55vh", lg: "100%" },
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

        {/* Waiting / Status overlay */}
        {!patientJoined && (
          <Box sx={{
            position: "absolute", inset: 0,
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            pointerEvents: "none",
          }}>
            <PersonOutline sx={{ fontSize: 80, color: "#1E5DA9", opacity: 0.4 }} />
            {leftMessage ? (
              <>
                <Typography sx={{ color: "#E65100", mt: 1, fontWeight: 600, fontSize: "1rem" }}>{leftMessage}</Typography>
                <Typography sx={{ color: "#888", mt: 0.5, fontSize: "0.85rem" }}>Waiting for next patient to join…</Typography>
              </>
            ) : (
              <Typography sx={{ color: "#333", mt: 1, opacity: 0.5 }}>No one joined yet — share the Room ID</Typography>
            )}
          </Box>
        )}
        {patientJoined && connectedPatientName && (
          <Box sx={{
            position: "absolute", top: 56, left: 16,
            px: 2, py: 0.5, borderRadius: 99,
            background: "rgba(255,255,255,0.85)", backdropFilter: "blur(8px)",
            border: "1px solid rgba(34,197,94,0.3)",
          }}>
            <Typography sx={{ color: "#16a34a", fontSize: "0.8rem", fontWeight: 600 }}>
              🟢 {connectedPatientName} connected
            </Typography>
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
        width: { xs: "100%", lg: 360 },
        flex: { xs: 1, lg: "none" },
        display: "flex",
        flexDirection: "column",
        background: "#ffffff",
        borderLeft: { xs: "none", lg: "1px solid rgba(0,0,0,0.07)" },
        borderTop: { xs: "1px solid rgba(0,0,0,0.07)", lg: "none" },
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

          {/* AI Suggestions list */}
          {suggestedMeds.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" sx={{ color: "#1E5DA9", fontWeight: 'bold', textTransform: "uppercase", letterSpacing: 1, fontSize: "0.7rem", opacity: 0.8 }}>
                ✨ AI Suggested Medicines ({suggestedMeds.length})
              </Typography>
              {suggestedMeds.map((med, i) => (
                <Box key={i} sx={{
                  mt: 1, p: 1.5, borderRadius: 2,
                  background: "#f8fbff",
                  border: "1px dashed rgba(30,93,169,0.4)",
                  display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1.5,
                  transition: "all 0.2s",
                  "&:hover": { background: "#f0f7ff", borderColor: "rgba(30,93,169,0.6)" }
                }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0 }}>
                    <Avatar sx={{ width: 32, height: 32, fontSize: "0.75rem", bgcolor: "rgba(30,93,169,0.1)", color: "#1E5DA9", flexShrink: 0 }}>
                      {med.name?.[0]?.toUpperCase()}
                    </Avatar>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ color: "#1E5DA9", fontWeight: 600, fontSize: "0.85rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {med.name}
                      </Typography>
                      {med.dosage && (
                        <Typography sx={{ color: "#666", fontSize: "0.72rem" }}>
                          {med.dosage}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                  <Button size="small" variant="contained"
                    onClick={() => handleSelectSuggestion(med)}
                    sx={{ minWidth: 0, textTransform: "none", background: "linear-gradient(90deg, #62b8ffff, #1E5DA9)", color: "#fff", "&:hover": { background: "linear-gradient(90deg, #1E5DA9, #0f3f7a)" }, px: 1.5, py: 0.5, borderRadius: 1.5 }}>
                    + Add
                  </Button>
                </Box>
              ))}
            </Box>
          )}

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
              <Autocomplete
                freeSolo
                options={COMMON_MEDICINES}
                inputValue={medName}
                onInputChange={(event, newInputValue) => {
                  setMedName(newInputValue || "");
                }}
                renderInput={(params) => (
                  <TextField {...params} label="Medicine Name" size="small" sx={lightInputSx} />
                )}
              />
              {[
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
              Clinical Diagnosis
            </Typography>
            <TextField
              fullWidth placeholder="AI will suggest or type here..."
              value={detectedCondition}
              onChange={e => setDetectedCondition(e.target.value)}
              sx={{ mt: 1, mb: 1.5, ...lightInputSx }}
            />

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
              <Button size="small" variant="contained" startIcon={<Email fontSize="small" />}
                onClick={handleSendToPatient}
                disabled={sendingEmail}
                sx={{
                  width: "100%",
                  textTransform: "none",
                  background: "linear-gradient(135deg, #FF6F00, #E65100)",
                  boxShadow: "0 4px 12px rgba(230,81,0,0.2)",
                  fontWeight: 700,
                  '&:hover': { background: "linear-gradient(135deg, #E65100, #BF360C)" }
                }}
              >
                {sendingEmail ? "Sending..." : "Send to Patient"}
              </Button>
            </Box>
          </Box>

          {/* Patient Medical Documents */}
          <Divider sx={{ borderColor: "rgba(0,0,0,0.07)", mb: 2 }} />
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
              <Description sx={{ color: "#1E5DA9", fontSize: 18 }} />
              <Typography variant="caption" sx={{ color: "#1E5DA9", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, fontSize: "0.7rem" }}>
                Medical Documents ({patientReports.length})
              </Typography>
            </Box>

            {patientReports.length === 0 ? (
              <Typography variant="caption" sx={{ color: "#888", fontStyle: "italic", display: "block", px: 1 }}>
                No documents uploaded by patient.
              </Typography>
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {patientReports.map((report, i) => (
                  <Box key={i} sx={{
                    p: 1.5, borderRadius: 2,
                    background: "rgba(0,0,0,0.02)",
                    border: "1px solid rgba(0,0,0,0.05)",
                    display: "flex", alignItems: "center", justifyContent: "space-between"
                  }}>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ fontSize: "0.8rem", fontWeight: 600, color: "#333", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {report.reportName}
                      </Typography>
                      <Typography sx={{ fontSize: "0.65rem", color: "#666" }}>
                        {report.reportType} • {new Date(report.uploadDate).toLocaleDateString()}
                      </Typography>
                    </Box>
                    <IconButton size="small" onClick={() => window.open(`${API_BASE}/${report.filePath.replace(/\\/g, '/')}`, "_blank")} sx={{ color: "#1E5DA9" }}>
                      <Visibility fontSize="small" />
                    </IconButton>
                  </Box>
                ))}
              </Box>
            )}
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
              active={joined} // Start as soon as doctor joins
              sessionId={roomId}
              patientId={queryParams.get("patientId") || "patient_101"}
              doctorId={doctorId}
              liveTranscript={notes}
              onMedicinesFound={handleAiMedicines}
              onTranscriptUpdate={(text) => { /* Only for internal sync if needed, but we don't auto-update notes anymore */ }}
              onSelectMedicine={handleSelectAiMedicine}
              onAiSummary={({ diagnosis, notes }) => {
                if (diagnosis) setDetectedCondition(diagnosis);
                if (notes) setNotes(notes);
              }}
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
        <DialogActions sx={{ p: 2, background: "#fff", gap: 1 }}>
          <Button variant="contained" onClick={handleSavePrescription} startIcon={<Save />} sx={{ textTransform: "none", background: "#1E5DA9", fontWeight: 600 }}>Save Locally</Button>
          <Button variant="outlined" onClick={handleDownload} startIcon={<Download />} sx={{ textTransform: "none", color: "#1E5DA9", borderColor: "#1E5DA9" }}>Download PDF</Button>
          <Button variant="contained" onClick={handleSendToPatient} disabled={sendingEmail} startIcon={<Email />} sx={{ textTransform: "none", background: "linear-gradient(135deg, #FF6F00, #E65100)", fontWeight: 700 }}>
            {sendingEmail ? "Sending..." : "Send to Patient"}
          </Button>
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
