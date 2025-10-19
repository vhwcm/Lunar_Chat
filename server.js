import { createServer } from "http";
import { Server } from "socket.io";
import express from "express";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

// Serve static files from the web folder
app.use(express.static(join(__dirname, 'web')));

const publicRooms = new Map(); // roomCode -> { name, userCount }

// --- Room Name Generation ---
const adjectives = ["Swift", "Silent", "Cosmic", "Lunar", "Solar", "Starry", "Magic", "Golden", "Crystal", "Whispering"];
const nouns = ["Nebula", "Galaxy", "Comet", "Starship", "Odyssey", "Sanctuary", "Oasis", "Citadel", "Haven", "Rift"];

function generateRoomName() {
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    return `${adj} ${noun}`;
}
// --------------------------

io.on("connection", (socket) => {
    console.log("✅ User connected:", socket.id);
    // Send the initial list of public rooms to the newly connected client
    socket.emit('publicRoomsUpdate', Array.from(publicRooms.values()));

    socket.on("createRoom", async ({ roomCode, roomName, isPublic, user }) => {
        const finalRoomName = roomName || generateRoomName();
        
        socket.join(roomCode);
        socket.data.user = user;
        socket.data.room = roomCode;

        if (isPublic) {
            const roomData = {
                code: roomCode,
                name: finalRoomName,
                userCount: 1
            };
            publicRooms.set(roomCode, roomData);
            // Broadcast the updated list of public rooms to all clients
            io.emit('publicRoomsUpdate', Array.from(publicRooms.values()));
        }

        socket.emit('roomCreated', { room: roomCode, name: finalRoomName });
        socket.to(roomCode).emit("system", { message: `${user} has created and joined the room.` });
        console.log(`[ROOM] ${user} created ${isPublic ? 'public' : 'private'} room: ${finalRoomName} (${roomCode})`);
    });

    socket.on("joinRoom", async ({ roomCode, user }) => {
        const existingRoom = io.sockets.adapter.rooms.get(roomCode);
        if (!existingRoom) {
            return socket.emit('error', { message: 'Room does not exist.' });
        }

        socket.join(roomCode);
        socket.data.user = user;
        socket.data.room = roomCode;

        // Update user count for public rooms
        if (publicRooms.has(roomCode)) {
            const roomData = publicRooms.get(roomCode);
            roomData.userCount = existingRoom.size;
            publicRooms.set(roomCode, roomData);
            io.emit('publicRoomsUpdate', Array.from(publicRooms.values()));
        }
        
        socket.emit('joined', { room: roomCode, name: publicRooms.get(roomCode)?.name || 'Private Room' });
        socket.to(roomCode).emit("system", { message: `${user} has joined the room.` });
        console.log(`[ROOM] ${user} joining room ${roomCode}`);
    });

    socket.on("leave", ({ room, user }) => {
        socket.leave(room);
        console.log(`[ROOM] ${user} leaving room ${room}`);
        socket.to(room).emit("system", { message: `${user} has left the room.` });
        
        // Update or remove the room from public list
        if (publicRooms.has(room)) {
            const roomData = publicRooms.get(room);
            const roomAdapter = io.sockets.adapter.rooms.get(room);
            if (!roomAdapter || roomAdapter.size === 0) {
                publicRooms.delete(room);
            } else {
                roomData.userCount = roomAdapter.size;
                publicRooms.set(room, roomData);
            }
            io.emit('publicRoomsUpdate', Array.from(publicRooms.values()));
        }
    });

    socket.on("roomMessage", async ({ room, user, msg }) => {
        console.log(`[MSG] Room: ${room} | User: ${user}: ${msg}`);
        io.to(room).emit("roomMessage", { user, msg });
    });

    socket.on("disconnect", () => {
        console.log("❌ User disconnected:", socket.id);
        const roomCode = socket.data.room;
        // Notify the room that the user has disconnected
        if (socket.data.user && roomCode) {
            socket.to(roomCode).emit("system", { message: `${socket.data.user} has disconnected.` });

            // Update or remove the room from public list on disconnect
            if (publicRooms.has(roomCode)) {
                const roomAdapter = io.sockets.adapter.rooms.get(roomCode);
                if (!roomAdapter || roomAdapter.size === 0) {
                    publicRooms.delete(roomCode);
                } else {
                    const roomData = publicRooms.get(roomCode);
                    roomData.userCount = roomAdapter.size;
                    publicRooms.set(roomCode, roomData);
                }
                io.emit('publicRoomsUpdate', Array.from(publicRooms.values()));
            }
        }
    });
});

httpServer.listen(3000, ()=> {
    console.log("server is running");
})



