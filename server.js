import express from "express";
import http from "http";
import { Server } from "socket.io";

console.log("[boot] server.js loaded");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    pingInterval: 25000,
    pingTimeout: 20000,
});

// 静的配信（public/ を配信）
app.use(express.static("public"));
// ヘルスチェック
app.get("/healthz", (_req, res) => res.send("ok"));

// 直近状態をメモリ保持（永続化なし）
const lastStateByRoom = new Map();

io.on("connection", (socket) => {
    console.log("[io] client connected:", socket.id);
    let room = "default";

    socket.on("room:join", (reqRoom) => {
        room = reqRoom || "default";
        socket.join(room);
        console.log(`[io] ${socket.id} joined ${room}`);
        const last = lastStateByRoom.get(room);
        if (last) socket.emit("state:apply", last);
    });

    socket.on("state:update", (state) => {
        lastStateByRoom.set(room, state);
        socket.to(room).emit("state:apply", state);
    });

    socket.on("disconnect", () => {
        console.log("[io] client disconnected:", socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.on("error", (err) => {
    console.error("[server error]", err.code, err.message);
});
server.listen(PORT, () => {
    console.log(`[listen] http://localhost:${PORT}`);
});