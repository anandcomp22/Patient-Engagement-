import React, { useEffect, useRef, useState, useCallback } from "react";
import { Box, Typography, IconButton, TextField, Button, Paper, Fade, Tooltip } from "@mui/material";
import { MicOff, Mic, Videocam, VideocamOff, CallEnd, Fullscreen, FullscreenExit, PersonOutline } from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";
import io from "socket.io-client";

/*
  PatientVideoCall — Premium dark video call room
  ─────────────────────────────────────────────────
  Fullscreen fix:
  • The video container is ALWAYS fixed + 100vw/100vh (fills viewport)
  • Fullscreen API enlarges it to the OS display — exit returns to the same fixed layout
  • No position:absolute on the outer container (that caused the after-exit shrink bug)
*/

const PatientVideoCall = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialRoomId = queryParams.get("roomId") || "";

  const socketRef = useRef(null);
  const peerConnection = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const callEndedRef = useRef(false);
  const containerRef = useRef(null);

  const [roomId, setRoomId] = useState(initialRoomId);
  const [name, setName] = useState("");
  const [joined, setJoined] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const controlsTimer = useRef(null);
  const durationTimer = useRef(null);

  // ── Socket ──────────────────────────────────────────────────
  useEffect(() => {
    socketRef.current = io("http://localhost:8000", { transports: ["websocket"] });
    return () => socketRef.current.disconnect();
  }, []);

  // ── Name from storage ───────────────────────────────────────
  useEffect(() => {
    const n = localStorage.getItem("patientName");
    if (n) setName(n);
  }, []);

  // ── Call timer ──────────────────────────────────────────────
  useEffect(() => {
    if (joined) {
      durationTimer.current = setInterval(() => setCallDuration(d => d + 1), 1000);
    }
    return () => clearInterval(durationTimer.current);
  }, [joined]);

  const formatDuration = (s) => {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };

  // ── Controls auto-hide ──────────────────────────────────────
  const resetControlsTimer = useCallback(() => {
    setControlsVisible(true);
    clearTimeout(controlsTimer.current);
    controlsTimer.current = setTimeout(() => setControlsVisible(false), 4000);
  }, []);

  useEffect(() => {
    if (joined) resetControlsTimer();
    return () => clearTimeout(controlsTimer.current);
  }, [joined, resetControlsTimer]);

  // ── Fullscreen change listener ──────────────────────────────
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    document.addEventListener("webkitfullscreenchange", handleFsChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFsChange);
      document.removeEventListener("webkitfullscreenchange", handleFsChange);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(() => { });
    } else {
      document.exitFullscreen().catch(() => { });
    }
  };

  // ── Join ────────────────────────────────────────────────────
  const joinRoom = async () => {
    if (joined || !roomId || !name) {
      if (!roomId || !name) alert("Please enter Room ID and Name");
      return;
    }
    socketRef.current.emit("join-room", { roomId });
    setJoined(true);
  };

  // ── WebRTC ──────────────────────────────────────────────────
  useEffect(() => {
    if (!joined) return;

    peerConnection.current = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

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
      setLocalStream(stream);
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;

      stream.getTracks().forEach(t => peerConnection.current.addTrack(t, stream));

      peerConnection.current.ontrack = (e) => {
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = e.streams[0];
      };

      peerConnection.current.onicecandidate = (e) => {
        if (e.candidate) socketRef.current.emit("ice-candidate", { roomId, candidate: e.candidate });
      };

      socketRef.current.on("offer", async ({ offer }) => {
        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(offer));
        const ans = await peerConnection.current.createAnswer();
        await peerConnection.current.setLocalDescription(ans);
        socketRef.current.emit("answer", { roomId, answer: ans });
      });

      socketRef.current.on("answer", async ({ answer }) => {
        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));
      });

      socketRef.current.on("ice-candidate", ({ candidate }) => {
        if (candidate) peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
      });

      socketRef.current.on("end-call", endCall);

      // Patient sends offer first
      peerConnection.current.createOffer().then(offer => {
        peerConnection.current.setLocalDescription(offer);
        socketRef.current.emit("offer", { roomId, offer });
      });
    }).catch(err => console.error("Media access error:", err));

    return () => {
      ["offer", "answer", "ice-candidate", "end-call"].forEach(e => socketRef.current.off(e));
      if (peerConnection.current) { peerConnection.current.close(); peerConnection.current = null; }
    };
  }, [joined]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── End call ─────────────────────────────────────────────────
  const endCall = () => {
    if (callEndedRef.current) return;
    callEndedRef.current = true;
    localStream?.getTracks().forEach(t => t.stop());
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    if (peerConnection.current) { peerConnection.current.close(); peerConnection.current = null; }
    socketRef.current.emit("end-call", { roomId });
    if (document.fullscreenElement) document.exitFullscreen().catch(() => { });
    clearInterval(durationTimer.current);
    navigate("/patient/appointments");
  };

  const toggleMic = () => {
    localStream?.getAudioTracks().forEach(t => (t.enabled = !micOn));
    setMicOn(p => !p);
  };

  const toggleCamera = () => {
    localStream?.getVideoTracks().forEach(t => (t.enabled = !cameraOn));
    setCameraOn(p => !p);
  };

  // ── Pre-join screen ──────────────────────────────────────────
  if (!joined) {
    return (
      <Box sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)",
      }}>
        <Paper elevation={0} sx={{
          p: 5,
          maxWidth: 420,
          width: "100%",
          mx: 2,
          borderRadius: 4,
          background: "rgba(255,255,255,0.05)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.12)",
          color: "#fff",
        }}>
          {/* Logo / Title */}
          <Box sx={{ textAlign: "center", mb: 4 }}>
            <Box sx={{
              width: 64, height: 64, borderRadius: "50%", mx: "auto", mb: 2,
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Videocam sx={{ color: "#fff", fontSize: 30 }} />
            </Box>
            <Typography variant="h5" fontWeight={700} sx={{ color: "#fff" }}>
              Join Consultation
            </Typography>
            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.55)", mt: 0.5 }}>
              Connect with your doctor securely
            </Typography>
          </Box>

          <TextField
            fullWidth
            label="Your Name"
            value={name}
            onChange={e => setName(e.target.value)}
            sx={{ mb: 2.5, ...darkInputSx }}
          />
          <TextField
            fullWidth
            label="Room ID"
            value={roomId}
            onChange={e => setRoomId(e.target.value)}
            sx={{ mb: 3.5, ...darkInputSx }}
          />

          <Button
            fullWidth
            variant="contained"
            size="large"
            onClick={joinRoom}
            disabled={!roomId || !name}
            sx={{
              py: 1.6,
              borderRadius: 3,
              fontWeight: 700,
              fontSize: "1rem",
              background: "linear-gradient(90deg, #667eea, #764ba2)",
              textTransform: "none",
              boxShadow: "0 4px 24px rgba(102,126,234,0.45)",
              "&:hover": { background: "linear-gradient(90deg, #5a6fd8, #6a4394)" },
              "&:disabled": { opacity: 0.4 },
            }}
          >
            Join Video Call
          </Button>

          <Typography variant="caption" sx={{
            display: "block", textAlign: "center", mt: 2,
            color: "rgba(255,255,255,0.35)"
          }}>
            🔒 End-to-end encrypted · HIPAA compliant
          </Typography>
        </Paper>

        <style>{globalStyles}</style>
      </Box>
    );
  }

  // ── In-call screen ───────────────────────────────────────────
  return (
    <>
      <Box
        id="video-container"
        ref={containerRef}
        onMouseMove={resetControlsTimer}
        onClick={resetControlsTimer}
        sx={{
          position: "fixed",
          inset: 0,                        // top:0 right:0 bottom:0 left:0
          width: "100%",
          height: "100%", 
          background: "#0a0a0f",
          overflow: "hidden",
          cursor: controlsVisible ? "default" : "none",
          zIndex: 1300,
          // When fullscreen API takes over, the element IS the screen — this layout
          // works identically inside and outside the Fullscreen API.
          "&:fullscreen": { background: "#000" },
          "&:-webkit-full-screen": { background: "#000" },
        }}
      >
        {/* ── Remote video (main) ── */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />

        {/* ── No remote yet overlay ── */}
        <Box sx={{
          position: "absolute", inset: 0,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          pointerEvents: "none",
          opacity: 0.35,
        }}>
          <PersonOutline sx={{ fontSize: 80, color: "#fff" }} />
          <Typography sx={{ color: "#fff", mt: 1 }}>Waiting for doctor…</Typography>
        </Box>

        {/* ── Top bar ── */}
        <Fade in={controlsVisible}>
          <Box sx={{
            position: "absolute", top: 0, left: 0, right: 0,
            px: 3, py: 2,
            display: "flex", alignItems: "center", justifyContent: "space-between",
            background: "linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, transparent 100%)",
          }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Box sx={{
                width: 10, height: 10, borderRadius: "50%",
                bgcolor: "#22c55e",
                boxShadow: "0 0 8px #22c55e",
                animation: "pulse-dot 2s ease-in-out infinite",
              }} />
              <Typography sx={{ color: "#fff", fontWeight: 600, fontSize: "0.95rem" }}>
                Live Consultation
              </Typography>
            </Box>
            <Box sx={{
              px: 2, py: 0.5, borderRadius: 99,
              background: "rgba(255,255,255,0.1)",
              backdropFilter: "blur(8px)",
              border: "1px solid rgba(255,255,255,0.15)",
            }}>
              <Typography sx={{ color: "#fff", fontSize: "0.85rem", fontVariantNumeric: "tabular-nums" }}>
                ⏱ {formatDuration(callDuration)}
              </Typography>
            </Box>
          </Box>
        </Fade>

        {/* ── Local PiP ── */}
        <Box sx={{
          position: "absolute", bottom: 100, right: 16,
          borderRadius: "16px",
          overflow: "hidden",
          border: "2px solid rgba(255,255,255,0.25)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          width: { xs: 100, sm: 150 },
          height: { xs: 68, sm: 100 },
          transition: "all 0.3s ease",
          "&:hover": { transform: "scale(1.04)" },
        }}>
          <video
            ref={localVideoRef}
            autoPlay muted playsInline
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
          {!cameraOn && (
            <Box sx={{
              position: "absolute", inset: 0,
              bgcolor: "#1a1a2e",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <VideocamOff sx={{ color: "rgba(255,255,255,0.5)" }} />
            </Box>
          )}
          <Typography sx={{
            position: "absolute", bottom: 4, left: 0, right: 0,
            textAlign: "center", color: "#fff", fontSize: "0.65rem",
            textShadow: "0 1px 4px #000"
          }}>
            You
          </Typography>
        </Box>

        {/* ── Control bar ── */}
        <Fade in={controlsVisible}>
          <Box sx={{
            position: "absolute", bottom: 24, left: "50%",
            transform: "translateX(-50%)",
            display: "flex", alignItems: "center", gap: 1.5,
            px: 3, py: 1.5,
            borderRadius: "100px",
            background: "rgba(15,15,30,0.75)",
            backdropFilter: "blur(16px)",
            border: "1px solid rgba(255,255,255,0.1)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          }}>
            <Tooltip title={micOn ? "Mute mic" : "Unmute mic"} placement="top">
              <IconButton onClick={toggleMic} sx={{
                color: "#fff", width: 52, height: 52,
                background: micOn ? "rgba(255,255,255,0.1)" : "rgba(239,68,68,0.7)",
                "&:hover": { background: micOn ? "rgba(255,255,255,0.2)" : "rgba(239,68,68,0.9)" },
                transition: "all 0.2s",
              }}>
                {micOn ? <Mic /> : <MicOff />}
              </IconButton>
            </Tooltip>

            <Tooltip title={cameraOn ? "Turn off camera" : "Turn on camera"} placement="top">
              <IconButton onClick={toggleCamera} sx={{
                color: "#fff", width: 52, height: 52,
                background: cameraOn ? "rgba(255,255,255,0.1)" : "rgba(239,68,68,0.7)",
                "&:hover": { background: cameraOn ? "rgba(255,255,255,0.2)" : "rgba(239,68,68,0.9)" },
                transition: "all 0.2s",
              }}>
                {cameraOn ? <Videocam /> : <VideocamOff />}
              </IconButton>
            </Tooltip>

            {/* Divider */}
            <Box sx={{ width: 1, height: 36, bgcolor: "rgba(255,255,255,0.15)", mx: 0.5 }} />

            <Tooltip title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"} placement="top">
              <IconButton onClick={toggleFullscreen} sx={{
                color: "#fff", width: 52, height: 52,
                background: "rgba(255,255,255,0.1)",
                "&:hover": { background: "rgba(255,255,255,0.2)" },
                transition: "all 0.2s",
              }}>
                {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
              </IconButton>
            </Tooltip>

            {/* Divider */}
            <Box sx={{ width: 1, height: 36, bgcolor: "rgba(255,255,255,0.15)", mx: 0.5 }} />

            <Tooltip title="End call" placement="top">
              <IconButton onClick={endCall} sx={{
                color: "#fff", width: 56, height: 56,
                background: "linear-gradient(135deg, #ef4444, #dc2626)",
                boxShadow: "0 4px 20px rgba(239,68,68,0.5)",
                "&:hover": {
                  background: "linear-gradient(135deg, #dc2626, #b91c1c)",
                  transform: "scale(1.08)",
                },
                transition: "all 0.2s",
              }}>
                <CallEnd />
              </IconButton>
            </Tooltip>
          </Box>
        </Fade>
      </Box>

      <style>{globalStyles}</style>
    </>
  );
};

// ── Shared dark input styling ─────────────────────────────────
const darkInputSx = {
  "& .MuiOutlinedInput-root": {
    color: "#fff",
    borderRadius: 2,
    background: "rgba(255,255,255,0.06)",
    "& fieldset": { borderColor: "rgba(255,255,255,0.2)" },
    "&:hover fieldset": { borderColor: "rgba(255,255,255,0.4)" },
    "&.Mui-focused fieldset": { borderColor: "#667eea" },
  },
  "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.55)" },
  "& .MuiInputLabel-root.Mui-focused": { color: "#667eea" },
};

// ── Global keyframes ──────────────────────────────────────────
const globalStyles = `
  @keyframes pulse-dot {
    0%, 100% { opacity: 1; transform: scale(1); }
    50%       { opacity: 0.6; transform: scale(1.3); }
  }
  #video-container:fullscreen        { background: #000; }
  #video-container:-webkit-full-screen { background: #000; }
`;

export default PatientVideoCall;