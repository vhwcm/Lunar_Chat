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

// Serve arquivos estáticos da pasta web
app.use(express.static(join(__dirname, 'web')));

io.on("connection", (socket) => {
    console.log("connected", socket.id);

    socket.on("join", async (room) => {
        socket.join(room);
        socket.emit("joined", room);
        
        const sockets = await io.in(room).fetchSockets();
        const socketIds = sockets.map(s => s.id);
        console.log("sockets in room", room, socketIds);
    });

    socket.on("leave", (room) => {
        socket.leave(room);
        socket.emit("left", room);
        socket.to(room).emit("system", `${socket.id} saiu da sala`)
    });

        socket.on("roomMessage", async ({room,user, msg}) => {
        console.log("roomMessage recv from", socket.id, "room:", room, "user",user, "msg:", msg);
        const sockets = await io.in(room).fetchSockets();
        const socketIds = sockets.map(s => s.id);
        console.log("will send to sockets in room:", socketIds);
        io.to(room).emit("roomMessage", {user, from: socket.id, msg});
    })

    socket.on("disconnect", () => {
        console.log("disconnect", socket.id);
    });
});

httpServer.listen(3000, ()=> {
    console.log("servidor ligado");
})



