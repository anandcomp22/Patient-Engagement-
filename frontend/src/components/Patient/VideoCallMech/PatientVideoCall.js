import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  IconButton,
  Button,
  TextField,
} from "@mui/material";
import {
  MicOff,
  Mic,
  Videocam,
  VideocamOff,
  CallEnd,
} from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";
import io from "socket.io-client";


const PatientVideoCall = () => {
  const navigate = useNavigate();
  const socketRef = useRef(null);
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialRoomId = queryParams.get("roomId") || "";
  //const iceQueue = useRef([]);
  const callEndedRef = useRef(false);


  const [roomId, setRoomId] = useState(initialRoomId);
  const [name, setName] = useState("");
  const [joined, setJoined] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnection = useRef(null);

  const requestFullScreen = () => {
    const el = document.getElementById("video-container");
    if (!el) return;

    if (el.requestFullscreen) el.requestFullscreen();
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen(); 
    else if (el.mozRequestFullScreen) el.mozRequestFullScreen();
    else if (el.msRequestFullscreen) el.msRequestFullscreen(); 
  };

  const exitFullScreen = () => {
    if (document.fullscreenElement) {
      if (document.exitFullscreen) document.exitFullscreen();
      else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
      else if (document.mozCancelFullScreen) document.mozCancelFullScreen();
      else if (document.msExitFullscreen) document.msExitFullscreen();
    }
  };

  
    useEffect(() => {
    socketRef.current = io("http://localhost:8000", {
      transports: ["websocket"],
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, []);
  
  useEffect(() => {
    const storedName = localStorage.getItem("patientName");
    if (storedName) setName(storedName);
  }, []);

  const joinRoom = async () => {
    if (joined) return;

    if (!roomId || !name) {
      alert("Please enter Room ID and Name");
      return;
    }

    await socketRef.current.emit("join-room", { roomId });
    setJoined(true);

    setTimeout(requestFullScreen, 300);
  };

  useEffect(() => {
    if (!joined) return;

    const configuration = {
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    };
    peerConnection.current = new RTCPeerConnection(configuration);

    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        setLocalStream(stream);

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // Publish tracks
        stream.getTracks().forEach((track) =>
          peerConnection.current.addTrack(track, stream)
        );

        // Listen for remote tracks
        peerConnection.current.ontrack = (event) => {
          if (remoteVideoRef.current)
            remoteVideoRef.current.srcObject = event.streams[0];
        };

        // ICE candidates
        peerConnection.current.onicecandidate = (event) => {
          if (event.candidate) {
            socketRef.current.emit("ice-candidate", { roomId, candidate: event.candidate });
          }
        };

        /* Socket listeners */
        socketRef.current.on("offer", async ({ offer }) => {
          await peerConnection.current.setRemoteDescription(
            new RTCSessionDescription(offer)
          );
          const answer = await peerConnection.current.createAnswer();
          await peerConnection.current.setLocalDescription(answer);
          socketRef.current.emit("answer", { roomId, answer });
        });

        socketRef.current.on("answer", async ({ answer }) => {
          await peerConnection.current.setRemoteDescription(
            new RTCSessionDescription(answer)
          );
        });

        socketRef.current.on("ice-candidate", ({ candidate }) => {
          if (candidate) {
            peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
          }
        });

        socketRef.current.on("end-call", endCall);

        // Create and send an offer
        createOffer();
      })
      .catch((err) => console.error("Error accessing media devices:", err));

    // cleanup
    return () => {
      socketRef.current.off("offer");
      socketRef.current.off("answer");
      socketRef.current.off("ice-candidate");
      socketRef.current.off("end-call");
    };
  }, [joined]);

  const createOffer = async () => {
    const offer = await peerConnection.current.createOffer();
    await peerConnection.current.setLocalDescription(offer);
    socketRef.current.emit("offer", { roomId, offer });
  };

  const endCall = () => {
    if (callEndedRef.current) return; 
    callEndedRef.current = true; 

    if (localStream) { 
      localStream.getTracks().forEach(t => t.stop()); 
    } 
    
    if (localVideoRef.current) 
      localVideoRef.current.srcObject = null; 
    
    if (remoteVideoRef.current) 
      remoteVideoRef.current.srcObject = null; 
    
    if (peerConnection.current) { 
      peerConnection.current.getSenders().forEach(s => { 
        peerConnection.current.removeTrack(s); 
      }); 
      
      peerConnection.current.close(); 
      peerConnection.current = null; 
    } 
    socketRef.current.emit("end-call", { roomId }); 
    if (document.fullscreenElement) { 
      document.exitFullscreen?.(); 
    } 
    navigate("/patient/appointments"); 
  };

  const toggleMic = () => {
    if (!localStream) return;
    localStream.getAudioTracks().forEach((t) => (t.enabled = !micOn));
    setMicOn(!micOn);
  };

  const toggleCamera = () => {
    if (!localStream) return;
    localStream.getVideoTracks().forEach((t) => (t.enabled = !cameraOn));
    setCameraOn(!cameraOn);
  };

  return (
    <Box sx={{ p: 3, mt: 10 }}>
      {!joined ? (
        <Paper sx={{ p: 3, maxWidth: 400, mx: "auto" }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Join Video Call
          </Typography>

          <TextField
            fullWidth
            label="Your Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Room ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            sx={{ mb: 2 }}
          />

          <Button
            fullWidth
            variant="contained"
            onClick={joinRoom}
            disabled={!roomId || !name}
          >
            Join Call
          </Button>
        </Paper>
      ) : (
        <Box sx={{ display: "flex", justifyContent: "center" }}>
          <Paper
            id="video-container"
            elevation={3}
            sx={{
              width: "100vw",
              height: "100vh",
              position: "absolute",
              backgroundColor: "#000",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
            }}
          >
            {/* remote video (fills screen) */}
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
            />

            {/* local picture‑in‑picture */}
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              style={{
                position: "absolute",
                bottom: "10px",
                right: "10px",
                width: "150px",
                height: "100px",
                borderRadius: "8px",
                border: "2px solid white",
                objectFit: "cover",
              }}
            />

            {/* control bar */}
            <Box
              sx={{
                position: "absolute",
                bottom: 20,
                left: "50%",
                transform: "translateX(-50%)",
                display: "flex",
                gap: 2,
                backgroundColor: "rgba(0,0,0,0.6)",
                borderRadius: "8px",
                px: 2,
                py: 1,
              }}
            >
              <IconButton onClick={toggleMic} sx={{ color: "white" }}>
                {micOn ? <Mic /> : <MicOff />}
              </IconButton>
              <IconButton onClick={toggleCamera} sx={{ color: "white" }}>
                {cameraOn ? <Videocam /> : <VideocamOff />}
              </IconButton>
              <IconButton onClick={endCall} sx={{ color: "red" }}>
                <CallEnd />
              </IconButton>
            </Box>
          </Paper>
        </Box>
      )}
    </Box>
  );
};

export default PatientVideoCall;
 