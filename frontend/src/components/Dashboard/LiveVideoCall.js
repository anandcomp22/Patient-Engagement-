import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";

const socket = io("http://localhost:5000");

const LiveVideoCall = () => {
  const myVideo = useRef(null);
  const userVideo = useRef(null);
  const [stream, setStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const peerConnection = useRef(null);

  useEffect(() => {
    socket.on("offer", async (offer) => {
      peerConnection.current = new RTCPeerConnection();
      peerConnection.current.setRemoteDescription(new RTCSessionDescription(offer));

      const currentStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setStream(currentStream);
      if (myVideo.current) myVideo.current.srcObject = currentStream;
      currentStream.getTracks().forEach((track) => peerConnection.current.addTrack(track, currentStream));

      const answer = await peerConnection.current.createAnswer();
      await peerConnection.current.setLocalDescription(answer);
      socket.emit("answer", answer);

      peerConnection.current.ontrack = (event) => {
        setRemoteStream(event.streams[0]);
      };
    });

    socket.on("answer", async (answer) => {
      if (peerConnection.current) {
        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));
      }
    });

    socket.on("ice-candidate", async (candidate) => {
      if (peerConnection.current) {
        await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });

    return () => {
      socket.off("offer");
      socket.off("answer");
      socket.off("ice-candidate");
    };
  }, []);

  const startCall = async () => {
    peerConnection.current = new RTCPeerConnection();

    peerConnection.current.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ice-candidate", event.candidate);
      }
    };

    peerConnection.current.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
    };

    const currentStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    setStream(currentStream);
    if (myVideo.current) myVideo.current.srcObject = currentStream;
    currentStream.getTracks().forEach((track) => peerConnection.current.addTrack(track, currentStream));

    const offer = await peerConnection.current.createOffer();
    await peerConnection.current.setLocalDescription(offer);
    socket.emit("offer", offer);

    setIsCallActive(true);
  };

  const endCall = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    if (remoteStream) {
      remoteStream.getTracks().forEach((track) => track.stop());
      setRemoteStream(null);
    }
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
    setIsCallActive(false);
  };

  return (
    <div>
      <div style={{ display: "flex", gap: "20px" }}>
        <div>
          <h3>My Video</h3>
          <video ref={myVideo} autoPlay muted style={{ width: "300px", border: "2px solid black" }} />
        </div>
        <div>
          <h3>User Video</h3>
          {remoteStream ? (
            <video ref={userVideo} autoPlay style={{ width: "300px", border: "2px solid black" }} srcObject={remoteStream} />
          ) : (
            <p>Waiting for user...</p>
          )}
        </div>
      </div>

      <div>
        {!isCallActive ? (
          <button onClick={startCall}>Start Call</button>
        ) : (
          <button onClick={endCall}>End Call</button>
        )}
      </div>
    </div>
  );
};

export default LiveVideoCall;
