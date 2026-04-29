import React, { useEffect, useRef, useState, useCallback } from "react";
import { Box, Typography, IconButton, TextField, Button, Paper, Fade, Tooltip, Avatar, Chip } from "@mui/material";
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
  const [doctorJoined, setDoctorJoined] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [inLobby, setInLobby] = useState(true);
  const [lobbyStatus, setLobbyStatus] = useState({ doctorPresent: false, patientPresent: false });
  const [mediaReady, setMediaReady] = useState(false);
  const [isMediaLoading, setIsMediaLoading] = useState(false);
  const controlsTimer = useRef(null);
  const durationTimer = useRef(null);

  // ── Socket (Connect ONCE) ───────────────────────────────────
  useEffect(() => {
    socketRef.current = io("http://localhost:8000", { transports: ["websocket"] });
    
    socketRef.current.on("lobby-status", (status) => {
      console.log("[Patient] Lobby status update:", status);
      setLobbyStatus(status);
    });

    socketRef.current.on("lobby-call-started", () => {
      console.log("[Patient] Doctor started the call. Joining automatically...");
      setInLobby(prevInLobby => {
        if (prevInLobby) {
          // If media is ready, auto-join. Otherwise, the button will show "Doctor is calling!"
          setTimeout(() => {
            document.getElementById("patient-join-btn")?.click();
          }, 100);
        }
        return prevInLobby;
      });
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
      socketRef.current.emit("lobby-join", { roomId, role: "patient", userName: name });
    }

    // Robust Polling: Every 2 seconds, re-assert our presence in the room.
    // This completely eliminates any missing events or desyncs.
    const interval = setInterval(() => {
      if (roomId && name && inLobby && socketRef.current && socketRef.current.connected) {
        socketRef.current.emit("lobby-ping", { roomId, role: "patient", userName: name });
      }
    }, 2000);

    return () => {
      clearInterval(interval);
      if (roomId && socketRef.current && socketRef.current.connected) {
        socketRef.current.emit("lobby-leave", { roomId, role: "patient" });
      }
    };
  }, [roomId, name, inLobby]);

  // ── Media Permissions Request ──────────────────────────────
  const handleRequestPermissions = async () => {
    setIsMediaLoading(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      // Permissions granted! Stop tracks to keep camera off in lobby.
      stream.getTracks().forEach(track => track.stop());
      setMediaReady(true);
    } catch (err) {
      console.error("Media permission denied:", err);
      alert("Please grant camera and microphone permissions to join the call.");
    } finally {
      setIsMediaLoading(false);
    }
  };

  // ── Media Preview ───────────────────────────────────────────
  // Per user request, we do not auto-start camera in lobby.
  /*
  useEffect(() => {
    if (inLobby && !localStream) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(stream => { 
          setLocalStream(stream); 
          if (localVideoRef.current) localVideoRef.current.srcObject = stream; 
        })
        .catch(console.error);
    }
  }, [inLobby, localStream]);
  */

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
    setInLobby(false);
  };

  const patientId = localStorage.getItem("patientId") || "patient_unknown";

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

      let iceCandidateQueue = [];

      socketRef.current.on("offer", async ({ offer }) => {
        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(offer));
        const ans = await peerConnection.current.createAnswer();
        await peerConnection.current.setLocalDescription(ans);
        socketRef.current.emit("answer", { roomId, answer: ans });

        iceCandidateQueue.forEach(c => peerConnection.current.addIceCandidate(c).catch(console.error));
        iceCandidateQueue = [];
      });

      socketRef.current.on("answer", async ({ answer }) => {
        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));

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

      socketRef.current.on("peer-ready", ({ role }) => {
        if (role === "doctor") setDoctorJoined(true);
      });

      socketRef.current.on("user-left", ({ role }) => {
        if (role === "doctor") setDoctorJoined(false);
      });

      // Signal that patient's media is fully initialized and ready to connect
      socketRef.current.emit("media-ready", { roomId, role: "patient", userName: name, patientId });
    }).catch(err => console.error("Media access error:", err));

    return () => {
      ["offer", "answer", "ice-candidate", "peer-ready", "user-left"].forEach(e => socketRef.current.off(e));
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
    socketRef.current.emit("user-left", { roomId, role: "patient", userName: name });
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
  // ── Pre-join / Waiting Room ──────────────────────────────────
  if (inLobby || !joined) {
    return (
      <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: { xs: 'column', md: 'row' }, bgcolor: "#f8fafc" }}>
        {/* Left Side: Info / Branding */}
        <Box sx={{
          flex: 1, display: { xs: 'none', md: 'flex' }, flexDirection: 'column', justifyContent: 'center',
          p: { md: 6, lg: 10 }, background: 'linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%)',
          position: 'relative', overflow: 'hidden'
        }}>
          <Box sx={{ position: 'absolute', top: -100, right: -50, width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,255,255,0.4)', filter: 'blur(20px)' }} />
          <Box sx={{ position: 'absolute', bottom: -50, left: -50, width: 250, height: 250, borderRadius: '50%', background: 'rgba(255,255,255,0.4)', filter: 'blur(20px)' }} />
          
          <Typography variant="h3" sx={{ color: '#1E5DA9', fontWeight: 800, mb: 2, zIndex: 1, fontSize: { xs: "2rem", md: "3rem" } }}>Your Virtual Care Room</Typography>
          <Typography variant="h6" sx={{ color: '#555', mb: 6, zIndex: 1, maxWidth: 500, lineHeight: 1.6 }}>Experience high-quality, secure consultations from the comfort of your home.</Typography>

          <Box sx={{ zIndex: 1, display: 'flex', flexDirection: 'column', gap: 3.5 }}>
            {[
              "Find a quiet, well-lit space",
              "Check your internet connection",
              "Test your microphone and camera",
              "Keep any relevant medical records nearby"
            ].map((text, idx) => (
              <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
                <Avatar sx={{ bgcolor: '#fff', color: '#1E5DA9', width: 40, height: 40, fontWeight: 700, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>{idx + 1}</Avatar>
                <Typography variant="body1" sx={{ color: '#333', fontWeight: 600, fontSize: '1.05rem' }}>{text}</Typography>
              </Box>
            ))}
          </Box>
        </Box>

        {/* Right Side: Join Form / Media Preview */}
        <Box sx={{ width: { xs: '100%', md: '520px' }, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', position: 'relative', zIndex: 2, boxShadow: { md: '-20px 0 40px rgba(0,0,0,0.04)' } }}>
          <Paper elevation={0} sx={{ p: { xs: 2.5, sm: 4, md: 6 }, width: "100%", mx: 2, background: "transparent", color: "#1E5DA9" }}>
            
            <Box sx={{ textAlign: "center", mb: 4 }}>
              <Typography variant="h5" fontWeight="800" sx={{ color: "#1E5DA9", mb: 1 }}>Waiting Room</Typography>
              <Typography variant="body2" sx={{ color: "#777", mb: 3 }}>Check your camera and microphone</Typography>
            </Box>

            <Box sx={{ 
              width: "100%", aspectRatio: "16/9", bgcolor: "#1a1a1a", borderRadius: 4, overflow: "hidden", position: "relative", 
              boxShadow: "0 10px 30px rgba(0,0,0,0.1)", mb: 4,
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center"
            }}>
              {mediaReady ? (
                <Box sx={{ textAlign: "center", animation: "fadeIn 0.5s ease-in" }}>
                  <Avatar sx={{ width: 100, height: 100, bgcolor: "rgba(30,93,169,0.1)", border: "1px solid #1E5DA9", mb: 2, mx: "auto" }}>
                    <PersonOutline sx={{ fontSize: 50, color: "#1E5DA9" }} />
                  </Avatar>
                  <Typography variant="subtitle1" sx={{ color: "#fff", fontWeight: 700 }}>Devices Ready</Typography>
                  <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)" }}>Camera & Mic will turn on when you join</Typography>
                </Box>
              ) : (
                <Box sx={{ textAlign: "center", p: 3 }}>
                  <Avatar sx={{ width: 80, height: 80, bgcolor: "rgba(255,255,255,0.05)", mb: 2, mx: "auto" }}>
                    <VideocamOff sx={{ fontSize: 40, color: "rgba(255,255,255,0.3)" }} />
                  </Avatar>
                  <Button 
                    variant="outlined" 
                    onClick={handleRequestPermissions} 
                    disabled={isMediaLoading}
                    sx={{ color: "#1E5DA9", borderColor: "#1E5DA9" }}
                  >
                    {isMediaLoading ? "Checking..." : "Enable Camera & Mic"}
                  </Button>
                </Box>
              )}
              
              {mediaReady && (
                <Box sx={{ position: "absolute", bottom: 16, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 2 }}>
                  <IconButton onClick={() => setMicOn(!micOn)} sx={{ bgcolor: micOn ? "rgba(255,255,255,0.1)" : "rgba(239,68,68,0.2)", color: micOn ? "#fff" : "#ef4444", width: 44, height: 44 }}>
                    {micOn ? <Mic fontSize="small" /> : <MicOff fontSize="small" />}
                  </IconButton>
                  <IconButton onClick={() => setCameraOn(!cameraOn)} sx={{ bgcolor: cameraOn ? "rgba(255,255,255,0.1)" : "rgba(239,68,68,0.2)", color: cameraOn ? "#fff" : "#ef4444", width: 44, height: 44 }}>
                    {cameraOn ? <Videocam fontSize="small" /> : <VideocamOff fontSize="small" />}
                  </IconButton>
                </Box>
              )}
            </Box>

            <Box sx={{ mb: 4, display: "flex", justifyContent: "center", gap: 2 }}>
              <Chip label={lobbyStatus.doctorPresent ? "Doctor is Ready" : "Waiting for Doctor..."} color={lobbyStatus.doctorPresent ? "success" : "default"} variant={lobbyStatus.doctorPresent ? "filled" : "outlined"} sx={{ fontWeight: 700 }} />
            </Box>

            <TextField fullWidth label="Your Name" value={name} onChange={e => setName(e.target.value)} sx={{ mb: 2.5, ...lightInputSx }} />
            <TextField fullWidth label="Room ID" value={roomId} onChange={e => setRoomId(e.target.value)} sx={{ mb: 4, ...lightInputSx }} />

            <Button
              id="patient-join-btn"
              fullWidth variant="contained" size="large" onClick={joinRoom} disabled={!roomId || !name || !lobbyStatus.doctorPresent || !mediaReady}
              sx={{ py: 1.6, borderRadius: 2, fontWeight: 700, fontSize: "1.05rem", background: "linear-gradient(90deg, #62b8ffff, #1E5DA9)", textTransform: "none", boxShadow: "0 8px 24px rgba(30,93,169,0.3)", "&:hover": { background: "linear-gradient(90deg, #1E5DA9, #0f3f7a)", transform: "translateY(-1px)", boxShadow: "0 12px 28px rgba(30,93,169,0.4)" }, transition: "all 0.2s ease-in-out", "&:disabled": { opacity: 0.5, transform: "none", boxShadow: "none" } }}
            >
              {!mediaReady ? "Enable Media to Join" : (lobbyStatus.doctorPresent ? "Enter Video Room" : "Waiting for Doctor...")}
            </Button>
          </Paper>
        </Box>

        {/* Start Media Preview useEffect Hook replacement */}
        <Box sx={{ display: "none" }}>
        </Box>
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
          background: "#f8fafc",
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
        {!doctorJoined && (
          <Box sx={{
            position: "absolute", inset: 0,
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            pointerEvents: "none",
            opacity: 0.5,
          }}>
            <PersonOutline sx={{ fontSize: 80, color: "#1E5DA9" }} />
            <Typography sx={{ color: "#333", mt: 1 }}>Waiting for doctor…</Typography>
          </Box>
        )}

        {/* ── Top bar ── */}
        <Fade in={controlsVisible}>
          <Box sx={{
            position: "absolute", top: 0, left: 0, right: 0,
            px: 3, py: 2,
            display: "flex", alignItems: "center", justifyContent: "space-between",
            background: "linear-gradient(to bottom, rgba(255,255,255,0.9) 0%, transparent 100%)",
          }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Box sx={{
                width: 10, height: 10, borderRadius: "50%",
                bgcolor: "#22c55e",
                boxShadow: "0 0 8px #22c55e",
                animation: "pulse-dot 2s ease-in-out infinite",
              }} />
              <Typography sx={{ color: "#1E5DA9", fontWeight: 600, fontSize: "0.95rem" }}>
                Live Consultation
              </Typography>
            </Box>
            <Box sx={{
              px: 2, py: 0.5, borderRadius: 99,
              background: "rgba(255,255,255,0.9)",
              backdropFilter: "blur(8px)",
              border: "1px solid rgba(0,0,0,0.1)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
            }}>
              <Typography sx={{ color: "#333", fontSize: "0.85rem", fontVariantNumeric: "tabular-nums" }}>
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
          border: "2px solid #1E5DA9",
          boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
          width: { xs: 100, sm: 150 },
          height: { xs: 68, sm: 100 },
          transition: "all 0.3s ease",
          "&:hover": { transform: "scale(1.04)" },
          background: "#fff",
        }}>
          <video
            ref={localVideoRef}
            autoPlay muted playsInline
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
          {!cameraOn && (
            <Box sx={{
              position: "absolute", inset: 0,
              bgcolor: "#f0f4f8",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <VideocamOff sx={{ color: "rgba(30,93,169,0.5)" }} />
            </Box>
          )}
          <Typography sx={{
            position: "absolute", bottom: 4, left: 0, right: 0,
            textAlign: "center", color: "#1E5DA9", fontSize: "0.65rem",
            fontWeight: "bold",
            textShadow: "0 1px 2px rgba(255,255,255,0.8)"
          }}>
            You
          </Typography>
        </Box>

        {/* ── Control bar ── */}
        <Fade in={controlsVisible}>
          <Box sx={{
            position: "absolute", bottom: 24, left: "50%",
            transform: "translateX(-50%)",
            display: "flex", alignItems: "center", gap: { xs: 1, sm: 1.5 },
            px: { xs: 2, sm: 3 }, py: 1.5,
            borderRadius: "100px",
            background: "rgba(255,255,255,0.9)",
            backdropFilter: "blur(16px)",
            border: "1px solid rgba(0,0,0,0.1)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
            width: { xs: "90%", sm: "auto" },
            justifyContent: "center"
          }}>
            <Tooltip title={micOn ? "Mute mic" : "Unmute mic"} placement="top">
              <IconButton onClick={toggleMic} sx={{
                color: micOn ? "#1E5DA9" : "#fff", width: { xs: 44, sm: 52 }, height: { xs: 44, sm: 52 },
                background: micOn ? "rgba(30,93,169,0.1)" : "rgba(239,68,68,0.9)",
                "&:hover": { background: micOn ? "rgba(30,93,169,0.2)" : "rgba(239,68,68,1)" },
                transition: "all 0.2s",
              }}>
                {micOn ? <Mic /> : <MicOff />}
              </IconButton>
            </Tooltip>

            <Tooltip title={cameraOn ? "Turn off camera" : "Turn on camera"} placement="top">
              <IconButton onClick={toggleCamera} sx={{
                color: cameraOn ? "#1E5DA9" : "#fff", width: { xs: 44, sm: 52 }, height: { xs: 44, sm: 52 },
                background: cameraOn ? "rgba(30,93,169,0.1)" : "rgba(239,68,68,0.9)",
                "&:hover": { background: cameraOn ? "rgba(30,93,169,0.2)" : "rgba(239,68,68,1)" },
                transition: "all 0.2s",
              }}>
                {cameraOn ? <Videocam /> : <VideocamOff />}
              </IconButton>
            </Tooltip>

            {/* Divider */}
            <Box sx={{ width: 1, height: 36, bgcolor: "rgba(0,0,0,0.1)", mx: 0.5 }} />

            <Tooltip title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"} placement="top">
              <IconButton onClick={toggleFullscreen} sx={{
                color: "#1E5DA9", width: { xs: 44, sm: 52 }, height: { xs: 44, sm: 52 },
                background: "rgba(30,93,169,0.1)",
                "&:hover": { background: "rgba(30,93,169,0.2)" },
                transition: "all 0.2s",
              }}>
                {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
              </IconButton>
            </Tooltip>

            {/* Divider */}
            <Box sx={{ width: 1, height: 36, bgcolor: "rgba(0,0,0,0.1)", mx: 0.5 }} />

            <Tooltip title="End call" placement="top">
              <IconButton onClick={endCall} sx={{
                color: "#fff", width: { xs: 48, sm: 56 }, height: { xs: 48, sm: 56 },
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

// ── Shared light input styling ─────────────────────────────────
const lightInputSx = {
  "& .MuiOutlinedInput-root": {
    color: "#333",
    borderRadius: 2,
    background: "rgba(255,255,255,0.6)",
    "& fieldset": { borderColor: "rgba(0,0,0,0.15)" },
    "&:hover fieldset": { borderColor: "rgba(0,0,0,0.3)" },
    "&.Mui-focused fieldset": { borderColor: "#1E5DA9" },
  },
  "& .MuiInputLabel-root": { color: "#666" },
  "& .MuiInputLabel-root.Mui-focused": { color: "#1E5DA9" },
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