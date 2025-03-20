import React, { useEffect, useRef, useState } from "react";
import { Box, Typography, Paper, Button, IconButton, TextField, Select, MenuItem } from "@mui/material";
import { MicOff, Mic, Videocam, VideocamOff, CallEnd, Edit } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import io from "socket.io-client";

const socket = io("http://localhost:3000");

const VideoCall = () => {
  const navigate = useNavigate();
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [editing, setEditing] = useState(false);
  const peerConnection = useRef(null);
  const [localStream, setLocalStream] = useState(null);

  // Prescription State
  const [medications, setMedications] = useState([
    { name: "Amoxicillin", dosage: "500mg", frequency: "Three times daily", duration: "7 days" },
    { name: "Ibuprofen", dosage: "400mg", frequency: "As needed", duration: "5 days" },
  ]);
  const [medName, setMedName] = useState("");
  const [dosage, setDosage] = useState("");
  const [frequency, setFrequency] = useState("");
  const [duration, setDuration] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    const constraints = { video: true, audio: true };

    navigator.mediaDevices.getUserMedia(constraints)
      .then((stream) => {
        setLocalStream(stream);
        localVideoRef.current.srcObject = stream;

        peerConnection.current = new RTCPeerConnection();
        stream.getTracks().forEach((track) => peerConnection.current.addTrack(track, stream));

        peerConnection.current.ontrack = (event) => {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = event.streams[0];
          }
        };

        socket.on("end-call", () => {
          endCall();
        });
      })
      .catch((err) => console.error("Error accessing media devices.", err));

    return () => {
      socket.off("end-call");
    };
  }, []);

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

  const endCall = () => {
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }
    socket.emit("end-call");
    peerConnection.current?.close();
    navigate("/appointments");
  };

  const addMedication = () => {
    if (medName && dosage && frequency && duration) {
      setMedications([...medications, { name: medName, dosage, frequency, duration }]);
      setMedName("");
      setDosage("");
      setFrequency("");
      setDuration("");
    }
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
          sx={{
            flex: 7,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            backgroundColor: "#000",
            color: "white",
            height: "80vh",
          }}
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

          {/* Control Icons */}
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
            <IconButton onClick={() => setEditing(true)} sx={{ color: "white" }}>
              <Edit />
            </IconButton>
          </Box>
        </Paper>

        {/* Prescription Section */}
        <Paper elevation={3} sx={{ flex: 3, padding: 2, height: "80vh", backgroundColor: "#f9f9f9" }}>
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
            Prescription Generator
          </Typography>
          <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>Patient Information</Typography>
          <Typography variant="body2">Name: John Doe | Age: 42</Typography>
          <Typography variant="body2">Patient ID: P-12345 | Date: 28/02/2025</Typography>

          <Typography variant="subtitle2" sx={{ fontWeight: "bold", mt: 2 }}>Medications</Typography>
          {medications.map((med, index) => (
            <Typography key={index} variant="body2">
              {med.name} - {med.dosage}, {med.frequency}, {med.duration}
            </Typography>
          ))}

          {editing && (
            <>
              <TextField fullWidth label="Medication Name" value={medName} onChange={(e) => setMedName(e.target.value)} sx={{ mt: 2 }} />
              <TextField fullWidth label="Dosage" value={dosage} onChange={(e) => setDosage(e.target.value)} sx={{ mt: 1 }} />
              <Select fullWidth value={frequency} onChange={(e) => setFrequency(e.target.value)} sx={{ mt: 1 }}>
                <MenuItem value="Once Daily">Once Daily</MenuItem>
                <MenuItem value="Twice Daily">Twice Daily</MenuItem>
              </Select>
              <TextField fullWidth label="Duration" value={duration} onChange={(e) => setDuration(e.target.value)} sx={{ mt: 1 }} />
              <Button variant="contained" sx={{ mt: 2 }} onClick={addMedication}>Add Medication</Button>
            </>
          )}

          <TextField fullWidth label="Additional Notes" multiline rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} sx={{ mt: 2 }} />
          <Button fullWidth variant="contained" color="primary" sx={{ mt: 2 }}>Generate Prescription</Button>
        </Paper>
      </Box>
    </Box>
  );
};

export default VideoCall;
