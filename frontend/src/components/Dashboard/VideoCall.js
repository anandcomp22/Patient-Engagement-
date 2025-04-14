import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  IconButton,
  TextField,
  Select,
  MenuItem,
} from "@mui/material";
import {
  MicOff,
  Mic,
  Videocam,
  VideocamOff,
  CallEnd,
  Edit,
} from "@mui/icons-material";
import { useNavigate, useParams } from "react-router-dom";
import io from "socket.io-client";

const audioContext = new (window.AudioContext || window.webkitAudioContext)();
let audioProcessor = null;

const socket = io("http://localhost:3000");

const DoctorVideoCall = () => {
  const { id: roomId } = useParams();
  const navigate = useNavigate();
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnection = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunks = useRef([]);

  const [localStream, setLocalStream] = useState(null);
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [editing, setEditing] = useState(false);

  const [medications, setMedications] = useState([]);
  const [medName, setMedName] = useState("");
  const [dosage, setDosage] = useState("");
  const [frequency, setFrequency] = useState("");
  const [duration, setDuration] = useState("");
  const [notes, setNotes] = useState("");

  const [detectedCondition, setDetectedCondition] = useState("");
  const [recommendedMeds, setRecommendedMeds] = useState([]);

  useEffect(() => {
    const constraints = { video: true, audio: true };

    navigator.mediaDevices
      .getUserMedia(constraints)
      .then((stream) => {
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        const source = audioContext.createMediaStreamSource(stream);
        audioProcessor = audioContext.createScriptProcessor(4096, 1, 1);

        source.connect(audioProcessor);
        audioProcessor.connect(audioContext.destination);

        audioProcessor.onaudioprocess = (e) => {
          const input = e.inputBuffer.getChannelData(0);
          const pcm = new Int16Array(input.length);
          for (let i = 0; i < input.length; i++) {
            const s = Math.max(-1, Math.min(1, input[i]));
            pcm[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
          }
          socket.emit("audio-stream", pcm.buffer);
        };

        peerConnection.current = new RTCPeerConnection();
        stream.getTracks().forEach((track) =>
          peerConnection.current.addTrack(track, stream)
        );

        peerConnection.current.ontrack = (event) => {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = event.streams[0];
          }
        };

        mediaRecorderRef.current = new MediaRecorder(stream);
        mediaRecorderRef.current.ondataavailable = (event) => {
          if (event.data.size > 0) {
            recordedChunks.current.push(event.data);
          }
        };
        mediaRecorderRef.current.start();

        socket.on("end-call", () => {
          endCall();
        });

        socket.on("transcript", (data) => {
          if (data.text) {
            setNotes((prev) => prev + " " + data.text);
            setDetectedCondition(data.condition);
            setRecommendedMeds(data.recommendations);

            // Auto-add recommended meds
            data.recommendations.forEach((med) => {
              if (!medications.some((m) => m.name === med)) {
                setMedications((prev) => [
                  ...prev,
                  { name: med, dosage: "", frequency: "", duration: "" },
                ]);
              }
            });
          }
        });
      })
      .catch((err) => console.error("Error accessing media devices", err));

    return () => {
      socket.off("end-call");
      socket.off("transcript");
    };
  }, []);

  const endCall = useCallback(async () => {
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
    }

    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }

    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;

    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }

    if (audioProcessor) {
      audioProcessor.disconnect();
    }

    const patientEmail = "sayyoni@example.com"; // Replace with dynamic value
    const patientName = "Sayyoni Parate";
    const prescriptionNo = `RX-${Date.now()}`;
    const contact = "+91-9876543210";
    const age = "22";
    const address = "Pune, India";

    try {
      await fetch("http://localhost:9000/prescriptions/save-transcript", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: "P-12345",
          patientname: patientName,
          condition: detectedCondition,
          notes,
          medications,
          date: new Date().toISOString(),
        }),
      });
    } catch (err) {
      console.error("Error saving transcript:", err);
    }

    try {
      const res = await fetch("http://localhost:9000/prescriptions/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient: patientName,
          age,
          address,
          contact,
          prescriptionNo,
          date: new Date().toLocaleDateString(),
          email: patientEmail,
          medicines: medications,
        }),
      });

      const result = await res.json();
      if (result.file) {
        const file = result.file;
        await fetch("http://localhost:9000/prescriptions/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: patientEmail, file }),
        });
        console.log("Prescription sent to patient:", patientEmail);
      }
    } catch (err) {
      console.error("Error generating/sending PDF:", err);
    }

    socket.emit("end-call", { roomId });
    socket.off("end-call");

    navigate("/prescriptions");
  }, [localStream, navigate, roomId, detectedCondition, notes, medications]);

  const toggleMic = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(
        (track) => (track.enabled = !micOn)
      );
      setMicOn(!micOn);
    }
  };

  const toggleCamera = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(
        (track) => (track.enabled = !cameraOn)
      );
      setCameraOn(!cameraOn);
    }
  };

  const addMedication = () => {
    if (medName && dosage && frequency && duration) {
      setMedications([
        ...medications,
        { name: medName, dosage, frequency, duration },
      ]);
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
          <video ref={remoteVideoRef} autoPlay playsInline muted style={{ width: "100%", height: "100%" }} />
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
            <IconButton onClick={() => setEditing(true)} sx={{ color: "white" }}>
              <Edit />
            </IconButton>
          </Box>
        </Paper>

        {/* Prescription Panel */}
        <Paper elevation={3} sx={{ flex: 3, padding: 2, height: "80vh", backgroundColor: "#f9f9f9" }}>
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
            Prescription Generator
          </Typography>
          <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
            Detected Condition: {detectedCondition || "Not detected yet"}
          </Typography>
          {recommendedMeds.length > 0 && (
            <>
              <Typography variant="subtitle2" sx={{ fontWeight: "bold", mt: 1 }}>
                Recommended Medicines:
              </Typography>
              {recommendedMeds.map((med, idx) => (
                <Typography key={idx} variant="body2">
                  - {med}
                </Typography>
              ))}
            </>
          )}

          <Typography variant="subtitle2" sx={{ fontWeight: "bold", mt: 2 }}>
            Medications
          </Typography>
          {medications.map((med, index) => (
            <Typography key={index} variant="body1">
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
                <MenuItem value="Three times daily">Three times daily</MenuItem>
              </Select>
              <TextField fullWidth label="Duration" value={duration} onChange={(e) => setDuration(e.target.value)} sx={{ mt: 1 }} />
              <Button variant="contained" sx={{ mt: 2 }} onClick={addMedication}>
                Add Medication
              </Button>
            </>
          )}

          <TextField
            fullWidth
            label="Additional Notes"
            multiline
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            sx={{ mt: 2 }}
          />
        </Paper>
      </Box>
    </Box>
  );
};

export default DoctorVideoCall;
