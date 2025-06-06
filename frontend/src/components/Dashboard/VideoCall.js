import React, { useEffect, useRef, useState } from "react";
import { Box, Typography, Paper, IconButton, Button, TextField } from "@mui/material";
import { MicOff, Mic, Videocam, VideocamOff, CallEnd } from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";
import io from "socket.io-client";

const socket = io("http://localhost:8000");

const VideoCall = () => {
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
  const [medications, setMedications] = useState([]);
  const [medName, setMedName] = useState("");
  const [dosage, setDosage] = useState("");
  const [frequency, setFrequency] = useState("");
  const [duration, setDuration] = useState("");
  const [notes, setNotes] = useState("");
  const [showMedForm, setShowMedForm] = useState(false);
  const [detectedCondition, setDetectedCondition] = useState("");
  const [callStartTime, setCallStartTime] = useState(null);


  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnection = useRef(null);

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

  const generateRoomId = () => {
    const randomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    setRoomId(randomId);
  };

  useEffect(() => {
    if (joined) {
      setCallStartTime(new Date().toISOString());
    }
  }, [joined]);
  
  useEffect(() => {
    const storedName = localStorage.getItem("doctorName");
    if (storedName) setName(storedName);
  }, []);

  const joinRoom = async () => {
    if (roomId && name) {
      await socket.emit("join-room", { roomId });
      setJoined(true);
    } else {
      alert("Please enter Room ID and Name");
    }
  };

  useEffect(() => {
    if (!joined) return;

    const configuration = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };

    peerConnection.current = new RTCPeerConnection(configuration);

    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((stream) => {
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        stream.getTracks().forEach((track) => {
          peerConnection.current.addTrack(track, stream);
        });

        peerConnection.current.ontrack = (event) => {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = event.streams[0];
          }
        };

        peerConnection.current.onicecandidate = (event) => {
          if (event.candidate) {
            socket.emit("ice-candidate", { roomId, candidate: event.candidate });
          }
        };

        socket.on("offer", async ({ offer }) => {
          await peerConnection.current.setRemoteDescription(new RTCSessionDescription(offer));
          const answer = await peerConnection.current.createAnswer();
          await peerConnection.current.setLocalDescription(answer);
          socket.emit("answer", { roomId, answer });
        });

        socket.on("answer", async ({ answer }) => {
          await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));
        });

        socket.on("ice-candidate", ({ candidate }) => {
          if (candidate) {
            peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
          }
        });

        createOffer();
      })
      .catch((err) => {
        console.error("Error accessing media devices:", err);
      });

    socket.on("end-call", () => {
      endCall();
    });

    return () => {
      socket.off("offer");
      socket.off("answer");
      socket.off("ice-candidate");
      socket.off("end-call");
    };
  }, [joined]);

  useEffect(() => {
    const detectConditionAndFillPrescription  = async (transcript) => {
      try {
        const res = await fetch("http://localhost:8000/api/ai/detect-condition", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transcript })
        });
  
        const result = await res.json();
  
        if (result.condition) {
          setDetectedCondition(result.condition);
          await fetchPrescriptionFromModel(result.condition);
        }
      } catch (err) {
        console.error("Failed to detect condition:", err);
      }
    };
  
    const fetchPrescriptionFromModel = async (condition) => {
      try {
        const res = await fetch(`http://localhost:8000/doctor/doctorprescript?condition=${condition}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("doctorToken")}` // replace if needed
          }
        });
    
        const data = await res.json();
        const med = data.prescription;
    
        if (med && med.name) {
          setMedications((prev) => [
            ...prev,
            {
              name: med.name,
              dosage: "",
              frequency: "",
              duration: "",
            },
          ]);
        }
      } catch (error) {
        console.error("Failed to fetch prescription from model:", error);
      }
    };
    
  
    socket.on("transcript", async (data) => {
      if (data.text) {
        setNotes((prev) => prev + " " + data.text + " ");
        await detectConditionAndFillPrescription(data.text);

      }
    });
  
    return () => {
      socket.off("transcript");
    };
  }, [medications]);
  

  const createOffer = async () => {
    const offer = await peerConnection.current.createOffer();
    await peerConnection.current.setLocalDescription(offer);
    socket.emit("offer", { roomId, offer });
  };

  const endCall = async () => {
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }
    if (peerConnection.current) {
      peerConnection.current.close();
    }
  
    const prescriptionData = {
      patient: name || "Patient",
      age: "22",
      address: "Pune",
      contact: "+91-9876543210",
      prescriptionNo: `RX-${Date.now()}`,
      date: new Date().toLocaleDateString(),
      email: "sayyoni@example.com",
      medicines: medications,
      notes: notes || "No additional notes"
    };
  
    try {
      const res = await fetch("http://localhost:8000/prescriptions/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prescriptionData)
      });
  
      const result = await res.json();
      console.log("Prescription generated:", result);
  
      if (result.file) {
        await fetch("http://localhost:8000/prescriptions/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: prescriptionData.email,
            file: result.file
          })
        });
      }
    } catch (e) {
      console.error("Prescription generation failed", e);
    }

    try {
      // Save video summary
      await fetch("http://localhost:8000/api/videocall/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId,
          doctorName: name,
          doctorEmail: localStorage.getItem("doctorEmail"),
          patientName: "Sayyoni More", // Replace with dynamic patient
          patientEmail: "sayyoni@example.com", // Replace with actual
          startTime: callStartTime,
          endTime: new Date().toISOString(),
          transcription: notes,
          detectedCondition,
          medications
        })
      });
    } catch (e) {
      console.error("Failed to save video call summary", e);
    }
    
  
    socket.emit("end-call", { roomId });
    navigate("/doctor/dashboard");
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
          variant="outlined"
          onClick={generateRoomId}
          sx={{ mb: 2 }}
        >
          Generate Random Room ID
        </Button>

      
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
        <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, px: 2 }}>
          {/* Video Panel */}
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

          {/* Prescription Panel */}
          <Paper elevation={3} sx={{ width: "30%", p: 2, height: "80vh", overflowY: "auto" }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Prescription Generator
            </Typography>
            <Typography variant="subtitle2" sx={{ fontWeight: "bold", mt: 2 }}>
              Medications
            </Typography>
            <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
                  Detected Condition: {detectedCondition || "Not detected yet"}
                </Typography>
            {medications.map((med, index) => (
              <Typography key={index} variant="body1">
                {med.name} - {med.dosage}, {med.frequency}, {med.duration}
              </Typography>
            ))}
            <Button
              variant="outlined"
              fullWidth
              sx={{ mt: 2 }}
              onClick={() => setShowMedForm((prev) => !prev)}
            >
              {showMedForm ? "Hide Medication Form" : "Add Medication"}
            </Button>

            {showMedForm && (
              <Box sx={{ mt: 2, maxHeight: 250, overflowY: "auto" }}>
                <TextField
                  fullWidth
                  label="Medicine Name"
                  value={medName}
                  onChange={(e) => setMedName(e.target.value)}
                  sx={{ mt: 1 }}
                />
                <TextField
                  fullWidth
                  label="Dosage"
                  value={dosage}
                  onChange={(e) => setDosage(e.target.value)}
                  sx={{ mt: 1 }}
                />
                <TextField
                  fullWidth
                  label="Frequency"
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                  sx={{ mt: 1 }}
                />
                <TextField
                  fullWidth
                  label="Duration"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  sx={{ mt: 1 }}
                />
                <Button variant="contained" fullWidth sx={{ mt: 2 }} onClick={addMedication}>
                  Insert
                </Button>
              </Box>
            )}

            <TextField
              fullWidth
              multiline
              rows={4}
              label="Additional Notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              sx={{ mt: 2 }}
            />
          </Paper>
        </Box>

      )}
    </Box>
  );
};

export default VideoCall;
