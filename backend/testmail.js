/*client folder:

client - src - screen - Lobby
install ReactPlayer
*/








/*server folder(index.js):
npm install socket.io
npm install socket.io-client

const {Server} = require("socet.io");
const io = new Server(8000, {
    cors: true,
});

const  emailToSocketIdMap = new Map();
const socketidToEmailMap = new Map();

io.on('connection', (socket) = > {
    console.log(`Socket Connected`, socket.id);
    socket.on('room:join', data => {
        const { email, room } = data;
        emailToSocketIdMap.set(email,socket.id);
        socketidToEmailMap.set(socket.id, email);
        io.to(room).emit('user:joined',{email,id: socket.id});
        socket.join(room);
        io.to(socket.id).emit('room:join', data);
        });
});
*/






/*App.js file:
import {Routes, Route} from 'react-router-dom';
import "./App.css";
import LobbyScreen from "./screens/Lobby";
import RoomPage from "./screens/Room";

function App(){
    return <div classname="App">
        <Routes>
            <Route path='/' element={<LobbyScreen />} />
            <Route path='/room/:roomId' element={<RoomPage />} />
        </Routes>
    </div>;
    }

export default App;
*/






/*screen folder - lobby.jsx(in src):
import React, {useState, useCallback, useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import {useSocket} from '../context/SocketProvider';

const LobbyScreen = () => {

    const [email, setEmail] = useState("");
    const [room, setRoom] = useState("");

    const socket = useSocket();
    const navigate = useNavigate();



    const handleSubmitForm = useCallback((e)=> {
        e.preventDefault();
        socket.emit('room:join', { email, room});
        
        }, [email,room,socket]
        );

    const handleJoinRoom = useCallback((data) = > {
        const { email,room} = data;
        navigate(`/room/${room}`);
    }, [navigate]
    );


    useEffect(() => {
        socket.on('room:join', handleJoinRoom);
        return ()=> {
            socket.off('room:join', handleJoinRoom)
        }
        });
        },[socket,handleJoinRoom]);


    return (
    <div>
        <h1>Looby</h1>
        <form onSubmit={handleSubmitForm}>
        <label htmlFor="email">email ID</label>
        <input type="email" id ="email" value={email} onChange={e => setEmail(e.target.value)}/>
        <br/>
        <label htmlFor="room">Room no.</label>
        <input type="text" id ="room" value={room} onChange={e => setRoom(e.target.value)}/>
        <br/>
        <button>join</button>
    </div>
};
)};

export default LobbyScreen;
*/





/*Room.jsx file in screen folder:
import React, {useEffect, useCallback, useState} from 'react';
import ReactPlayer from 'react-player';
import { useSocket } from "../context/SocketProvider";

const RoomPage = () => {
    const socket = useSocket();
    const [remoteSocketId, setRemoteSocketId] = useState(null);
    const [myStream, setStream] = useState()

    const handleUserJoined = useCallback(({email, id}) => {
        console.log(`Email ${email} joined room);
        setRemoteSocketId(id)
        },[])

    const handleCallUser = useCallback(() => {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true});
        setMyStream(stream)
        }, []);

    useEffect(() = > {
        socket.on('user:joined', handleUserJoined);

        return () => {
            socket.off("user:joined", handleUserJoined)}
    }, [socket, handleUserJoined]);


    return (
        <div>
            <h1>Room Page</h1>
            <h4>{remoteSocketId ? 'Connected' : 'No one in room'}</h4>
            {remoteSocketId && <button onClick={handleCallUser}>CALL</button>}
            { myStream && <ReactPlayer playing muted height ="300px" width="500px" url={myStream}/>}
        </div>
        );
    };
export default RoomPage;


*/







/*index.js(frontend):

import react from 'react';
import ReactDOM from'react-dom/client';
import { BrowserRouter} from "react-router-dom";
import'./index.css;
import App from './APP';
import reportWebVitals from './reportWebVitals'
import { SocketProvider } from "./context/SocketProvider";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
    <React.StrictMode>
        <BroswerRouter>
        <SocketProvider>
        <App/>
        </SocketProvider>
        </BroswerRouter>
    </React.StrictMode>
)
    */









/*new folder in src name as context have file SocketProvider.jsx

import React, { createContext, useMemo } from 'react';
import {} from 'socket.io-client';

const SocketContext = createContext(null);

export const useSocket = () => {
    const socket = useContext(SocketContext)
    return socket;
    }

export const SocketProvider = (props = > {

    const socket = useMemo(()=> io('localhost:8000'), []);

    return (
        <SocketContext.Provider value={socket}>
            {props.children}
        </SocketContext.Provider>
        
        
        
*/