import React, { useEffect, useRef, useState } from "react";
import { Box, Typography, Paper, Button } from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";
import io from "socket.io-client";

const socket = io("http://localhost:3000");

const VideoCall = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const [floating, setFloating] = useState(false);
  const peerConnection = useRef(null);

  useEffect(() => {
    const constraints = { video: true, audio: true };
    
    navigator.mediaDevices.getUserMedia(constraints)
      .then((stream) => {
        localVideoRef.current.srcObject = stream;

        peerConnection.current = new RTCPeerConnection();
        stream.getTracks().forEach((track) => peerConnection.current.addTrack(track, stream));

        peerConnection.current.ontrack = (event) => {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = event.streams[0];
          }
        };

        peerConnection.current.onicecandidate = (event) => {
          if (event.candidate) {
            socket.emit("ice-candidate", event.candidate);
          }
        };

        socket.on("offer", async (offer) => {
          await peerConnection.current.setRemoteDescription(new RTCSessionDescription(offer));
          const answer = await peerConnection.current.createAnswer();
          await peerConnection.current.setLocalDescription(answer);
          socket.emit("answer", answer);
        });

        socket.on("answer", async (answer) => {
          await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));
        });

        socket.on("ice-candidate", (candidate) => {
          peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
        });

        socket.on("end-call", () => {
          stream.getTracks().forEach((track) => track.stop());
          peerConnection.current.close();
          navigate("/appointments"); // Redirect after call ends
        });

      })
      .catch((err) => console.error("Error accessing media devices.", err));

    return () => {
      socket.off("offer");
      socket.off("answer");
      socket.off("ice-candidate");
      socket.off("end-call");
    };
  }, [navigate]);

  const endCall = () => {
    socket.emit("end-call");
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100vh", mt: 10 }}>
      <Typography variant="h5" fontWeight="bold" sx={{ mb: 2, textAlign: "center" }}>
        Live Video Consultation
      </Typography>

      <Box sx={{ display: "flex", flexGrow: 1, gap: 2, px: 3 }}>
        {/* Video Section */}
        <Paper
          elevation={3}
          sx={{ flex: 7, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", backgroundColor: "#000", color: "white", height: "80vh" }}
        >
          <video ref={localVideoRef} autoPlay playsInline muted style={{ width: "100%", height: "100%" }} />
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
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
        </Paper>

        {/* Prescription Section */}
        <Paper elevation={3} sx={{ flex: 3, padding: 2, height: "80vh", backgroundColor: "#f9f9f9" }}>
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>Prescription Generation</Typography>
          <Typography variant="body1" color="textSecondary">Add doctor's notes, prescribed medicines, and instructions here.</Typography>
          <Button variant="contained" color="error" sx={{ mt: 4 }} onClick={endCall}>
            End Video Call
          </Button>
        </Paper>
      </Box>
    </Box>
  );
};

export default VideoCall;
