import React, { useEffect, useRef, useState } from "react";
import { Box, Typography, Paper, IconButton, Button, TextField } from "@mui/material";
import { MicOff, Mic, Videocam, VideocamOff, CallEnd } from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";
import io from "socket.io-client";

const socket = io("http://localhost:3000");

const PatientVideoCall = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialRoomId = queryParams.get("roomId") || "";

  const [roomId, setRoomId] = useState(initialRoomId);
  const [name, setName] = useState("");
  const [joined, setJoined] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnection = useRef(null);

  // Optional: Auto-fill name if stored in localStorage
  useEffect(() => {
    const storedName = localStorage.getItem("patientName");
    if (storedName) setName(storedName);
  }, []);

  const joinRoom = () => {
    if (roomId && name) {
      socket.emit("join-room", { roomId, name });
      setJoined(true);
    } else {
      alert("Please enter Room ID and Name");
    }
  };

  useEffect(() => {
    if (!joined) return;

    const constraints = { video: true, audio: true };

    navigator.mediaDevices.getUserMedia(constraints)
      .then((stream) => {
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        peerConnection.current = new RTCPeerConnection();

        stream.getTracks().forEach((track) =>
          peerConnection.current.addTrack(track, stream)
        );

        peerConnection.current.ontrack = (event) => {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = event.streams[0];
          }
        };

        socket.on("end-call", () => {
          endCall();
        });
      })
      .catch((err) => console.error("Error accessing media devices", err));

    return () => {
      socket.off("end-call");
    };
  }, [joined]);

  const endCall = () => {
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }

    if (peerConnection.current) {
      peerConnection.current.close();
    }

    socket.emit("end-call", { roomId });
    navigate("/patient/appointments");
  };

  const toggleMic = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => (track.enabled = !micOn));
      setMicOn(!micOn);
    }
  };

  const toggleCamera = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => (track.enabled = !cameraOn));
      setCameraOn(!cameraOn);
    }
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
        <Box sx={{ display: "flex", justifyContent: "center", gap: 2 }}>
          <Paper
            elevation={3}
            sx={{
              width: "70%",
              height: "80vh",
              position: "relative",
              backgroundColor: "#000",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              muted
              style={{ width: "100%", height: "100%" }}
            />
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              style={{
                position: "absolute",
                bottom: "10px",
                right: "10px",
                width: "150px",
                height: "100px",
                borderRadius: "8px",
                border: "2px solid white",
              }}
            />

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
                padding: "8px 16px",
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