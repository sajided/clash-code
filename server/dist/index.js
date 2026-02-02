import "dotenv/config";
import { createServer } from "node:http";
import express from "express";
import { Server } from "socket.io";
import cors from "cors";
import { createRoom, addPlayerToRoom, getRoomByCode, getRoomBySocket, getPlayerInfos, getPlayerNames, playSabotageCard, resetRoundMana, addManaFromKeystrokes, } from "./game.js";
import { getProblemsForRounds } from "./problems.js";
import { executeCode } from "./execute.js";
const allowedOrigins = (process.env.FRONTEND_URL ?? "http://localhost:3000")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
const corsOptions = {
    origin: (origin, cb) => {
        if (!origin)
            return cb(null, true);
        if (allowedOrigins.includes("*"))
            return cb(null, true);
        cb(null, allowedOrigins.includes(origin));
    },
};
const app = express();
app.use(cors(corsOptions));
app.use(express.json());
const httpServer = createServer(app);
const ioCors = allowedOrigins.includes("*") || allowedOrigins.length === 0
    ? { origin: true }
    : { origin: allowedOrigins };
const io = new Server(httpServer, {
    cors: ioCors,
});
const rooms = new Map();
const lastManaGrantAt = new Map();
const MANA_GRANT_COOLDOWN_MS = 500;
app.get("/health", (_req, res) => {
    res.json({ ok: true });
});
io.on("connection", (socket) => {
    socket.on("create_room", (name) => {
        const room = createRoom(socket.id, name);
        rooms.set(room.id, room);
        socket.join(room.id);
        socket.emit("room_created", { roomId: room.id, code: room.code });
    });
    socket.on("join_room", (code, name) => {
        const room = getRoomByCode(rooms, code);
        if (!room) {
            socket.emit("join_error", "Room not found");
            return;
        }
        if (room.players.size >= 2) {
            socket.emit("join_error", "Room is full");
            return;
        }
        if (room.status !== "waiting" && room.status !== "configuring") {
            socket.emit("join_error", "Game already started");
            return;
        }
        addPlayerToRoom(room, socket.id, name);
        socket.join(room.id);
        const isHost = room.hostSocketId === socket.id;
        const playerCount = room.players.size;
        const players = getPlayerInfos(room);
        socket.emit("join_success", { roomId: room.id, code: room.code, isHost, playerCount, players });
        socket.to(room.id).emit("player_joined", { socketId: socket.id, playerCount, players });
    });
    socket.on("set_config", (payload) => {
        const room = getRoomBySocket(rooms, socket.id);
        if (!room || room.hostSocketId !== socket.id)
            return;
        if (payload.roundRatings)
            room.roundRatings = payload.roundRatings;
        if (payload.problemDifficulty)
            room.problemDifficulty = payload.problemDifficulty;
    });
    socket.on("set_language", (language) => {
        const room = getRoomBySocket(rooms, socket.id);
        if (!room || room.status !== "waiting" && room.status !== "configuring")
            return;
        const player = room.players.get(socket.id);
        if (player) {
            player.language = language;
            const players = getPlayerInfos(room);
            io.to(room.id).emit("player_ready", { socketId: socket.id, players });
        }
    });
    socket.on("player_ready", async () => {
        const room = getRoomBySocket(rooms, socket.id);
        if (!room)
            return;
        if (room.status !== "waiting" && room.status !== "configuring")
            return;
        if (room.players.size < 2)
            return;
        const player = room.players.get(socket.id);
        if (!player)
            return;
        player.ready = true;
        const players = getPlayerInfos(room);
        io.to(room.id).emit("player_ready", { socketId: socket.id, players });
        const allReady = [...room.players.values()].every((p) => p.ready);
        if (!allReady)
            return;
        room.status = "playing";
        try {
            room.problems = await getProblemsForRounds(room.problemDifficulty);
        }
        catch (err) {
            console.error("getProblemsForRounds failed:", err);
            return;
        }
        room.round = 1;
        resetRoundMana(room);
        const problem = room.problems[0];
        if (!problem)
            return;
        const playerIds = [...room.players.keys()];
        const playerNames = getPlayerNames(room);
        for (const sid of playerIds) {
            const opponentSocketId = playerIds.find((p) => p !== sid);
            const p = room.players.get(sid);
            io.to(sid).emit("game_start", {
                problem,
                round: 1,
                opponentSocketId,
                playerNames,
                language: p?.language ?? "cpp",
            });
        }
    });
    socket.on("get_game_state", (code) => {
        const room = getRoomByCode(rooms, code);
        if (!room || room.status !== "playing" || !room.problems)
            return;
        if (!room.players.has(socket.id))
            return;
        const problem = room.problems[room.round - 1];
        if (!problem)
            return;
        const opponentSocketId = [...room.players.keys()].find((p) => p !== socket.id);
        const playerNames = getPlayerNames(room);
        const player = room.players.get(socket.id);
        socket.emit("game_start", {
            problem,
            round: room.round,
            opponentSocketId,
            playerNames,
            language: player?.language ?? "cpp",
        });
    });
    socket.on("play_card", (payload) => {
        const room = getRoomBySocket(rooms, socket.id);
        if (!room || room.status !== "playing")
            return;
        const { card, targetSocketId } = payload;
        const result = playSabotageCard(room, socket.id, card, targetSocketId);
        if (card === "shield") {
            io.to(socket.id).emit("mana_update", { mana: room.players.get(socket.id).mana });
            return;
        }
        const targetId = targetSocketId ?? "";
        const target = room.players.get(targetId);
        if (!target)
            return;
        if (result.applied) {
            io.to(targetId).emit("apply_effect", {
                type: card,
                duration: card === "fog" ? 5 : card === "freeze" ? 3 : undefined,
            });
        }
        else {
            io.to(socket.id).emit("effect_blocked");
        }
        io.to(socket.id).emit("mana_update", { mana: room.players.get(socket.id).mana });
    });
    socket.on("submit_code", async (_code, language) => {
        const room = getRoomBySocket(rooms, socket.id);
        if (!room || room.status !== "playing" || !room.problems)
            return;
        const player = room.players.get(socket.id);
        if (!player)
            return;
        player.code = _code;
        const problem = room.problems[room.round - 1];
        if (!problem)
            return;
        const { accepted, verdict } = await executeCode(_code, problem.sampleTests, language ?? "cpp");
        const playerNames = getPlayerNames(room);
        if (accepted) {
            player.score += 1;
            const scores = {};
            for (const [sid, p] of room.players)
                scores[sid] = p.score;
            if (player.score >= 2) {
                room.status = "finished";
                room.winnerSocketId = socket.id;
                io.to(room.id).emit("game_over", { winnerSocketId: socket.id, scores, playerNames });
            }
            else {
                room.round = (room.round + 1);
                resetRoundMana(room);
                const nextProblem = room.problems[room.round - 1];
                io.to(room.id).emit("round_result", {
                    winnerSocketId: socket.id,
                    verdict: "Accepted",
                    scores,
                    nextRound: room.round,
                    playerNames,
                });
                if (nextProblem) {
                    for (const sid of room.players.keys()) {
                        const opponentSocketId = [...room.players.keys()].find((p) => p !== sid);
                        const p = room.players.get(sid);
                        io.to(sid).emit("game_start", {
                            problem: nextProblem,
                            round: room.round,
                            opponentSocketId,
                            playerNames,
                            language: p?.language ?? "cpp",
                        });
                    }
                }
            }
        }
        else {
            const scores = {};
            for (const [sid, p] of room.players)
                scores[sid] = p.score;
            io.to(room.id).emit("round_result", {
                winnerSocketId: null,
                verdict,
                scores,
                playerNames,
            });
        }
    });
    socket.on("give_up", () => {
        const room = getRoomBySocket(rooms, socket.id);
        if (!room || room.status !== "playing" || !room.problems)
            return;
        const player = room.players.get(socket.id);
        if (!player)
            return;
        const opponentSocketId = [...room.players.keys()].find((sid) => sid !== socket.id);
        if (!opponentSocketId)
            return;
        const opponent = room.players.get(opponentSocketId);
        if (!opponent)
            return;
        opponent.score += 1;
        const scores = {};
        for (const [sid, p] of room.players)
            scores[sid] = p.score;
        const playerNames = getPlayerNames(room);
        if (opponent.score >= 2) {
            room.status = "finished";
            room.winnerSocketId = opponentSocketId;
            io.to(room.id).emit("game_over", { winnerSocketId: opponentSocketId, scores, playerNames });
        }
        else {
            room.round = (room.round + 1);
            resetRoundMana(room);
            const nextProblem = room.problems[room.round - 1];
            io.to(room.id).emit("round_result", {
                winnerSocketId: opponentSocketId,
                verdict: "Give up",
                scores,
                nextRound: room.round,
                playerNames,
            });
            if (nextProblem) {
                for (const sid of room.players.keys()) {
                    const oppId = [...room.players.keys()].find((p) => p !== sid);
                    const p = room.players.get(sid);
                    io.to(sid).emit("game_start", {
                        problem: nextProblem,
                        round: room.round,
                        opponentSocketId: oppId,
                        playerNames,
                        language: p?.language ?? "cpp",
                    });
                }
            }
        }
    });
    socket.on("update_code", (code) => {
        const room = getRoomBySocket(rooms, socket.id);
        if (!room)
            return;
        const player = room.players.get(socket.id);
        if (player)
            player.code = code;
    });
    socket.on("keystroke_chunk", (charCount) => {
        const room = getRoomBySocket(rooms, socket.id);
        if (!room || room.status !== "playing")
            return;
        const now = Date.now();
        const last = lastManaGrantAt.get(socket.id) ?? 0;
        if (now - last < MANA_GRANT_COOLDOWN_MS)
            return;
        const capped = Math.min(Math.max(0, Math.floor(charCount)), 100);
        const result = addManaFromKeystrokes(room, socket.id, capped);
        if (result) {
            lastManaGrantAt.set(socket.id, now);
            socket.emit("mana_update", { mana: result.mana });
        }
    });
    socket.on("disconnect", () => {
        const room = getRoomBySocket(rooms, socket.id);
        if (room) {
            const wasHost = room.hostSocketId === socket.id;
            room.players.delete(socket.id);
            if (room.players.size === 0) {
                rooms.delete(room.id);
            }
            else if (wasHost) {
                const newHost = [...room.players.keys()][0];
                if (newHost)
                    room.hostSocketId = newHost;
            }
            else if (room.status === "playing") {
                const opponent = [...room.players.values()][0];
                if (opponent) {
                    room.status = "finished";
                    room.winnerSocketId = opponent.socketId;
                    const scores = {};
                    for (const [sid, p] of room.players)
                        scores[sid] = p.score;
                    const playerNames = getPlayerNames(room);
                    io.to(room.id).emit("game_over", {
                        winnerSocketId: opponent.socketId,
                        scores,
                        playerNames,
                    });
                }
            }
        }
    });
});
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 4000;
httpServer.listen(PORT, () => {
    console.log(`Algo Royale server running at http://localhost:${PORT}`);
});
