"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useSocket } from "@/components/SocketProvider";

type Difficulty = "Easy" | "Mid" | "Hard";

const DIFFICULTY_TO_SERVER: Record<Difficulty, "Easy" | "Medium" | "Hard"> = {
  Easy: "Easy",
  Mid: "Medium",
  Hard: "Hard",
};

export default function LobbyPage() {
  const params = useParams();
  const router = useRouter();
  const socket = useSocket();
  const code = params.code as string;
  const [isHost, setIsHost] = useState(false);
  const [playerCount, setPlayerCount] = useState(1);
  const [players, setPlayers] = useState<{ socketId: string; name?: string; ready?: boolean; language?: "c" | "cpp" }[]>([]);
  const [difficulty, setDifficulty] = useState<Difficulty>("Mid");
  const [language, setLanguage] = useState<"c" | "cpp">("cpp");
  const [iAmReady, setIAmReady] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (isHost && ready) {
      socket.emit("set_config", {
        problemDifficulty: DIFFICULTY_TO_SERVER[difficulty],
      });
    }
  }, [difficulty, isHost, ready, socket]);

  useEffect(() => {
    if (!code) return;

    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("algo-royale-lobby");
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as {
            code?: string;
            isHost?: boolean;
            playerCount?: number;
            players?: { socketId: string; name?: string; ready?: boolean; language?: "c" | "cpp" }[];
          };
          if (parsed.code === code) {
            setIsHost(parsed.isHost ?? false);
            setPlayerCount(parsed.playerCount ?? 1);
            if (parsed.players) setPlayers(parsed.players);
            setReady(true);
          }
          sessionStorage.removeItem("algo-royale-lobby");
        } catch {
          sessionStorage.removeItem("algo-royale-lobby");
        }
      }
    }

    const handleJoinSuccess = (payload: {
      isHost: boolean;
      playerCount?: number;
      players?: { socketId: string; name?: string; ready?: boolean; language?: "c" | "cpp" }[];
    }) => {
      setIsHost(payload.isHost);
      if (payload.playerCount !== undefined) setPlayerCount(payload.playerCount);
      if (payload.players) setPlayers(payload.players);
      setReady(true);
    };

    const handlePlayerJoined = (payload: {
      playerCount?: number;
      players?: { socketId: string; name?: string; ready?: boolean; language?: "c" | "cpp" }[];
    }) => {
      if (payload.playerCount !== undefined) setPlayerCount(payload.playerCount);
      else setPlayerCount((c) => Math.min(2, c + 1));
      if (payload.players) setPlayers(payload.players);
    };

    const handlePlayerReady = (payload: {
      socketId: string;
      players?: { socketId: string; name?: string; ready?: boolean; language?: "c" | "cpp" }[];
    }) => {
      if (payload.players) setPlayers(payload.players);
    };

    const handleGameStart = (payload?: {
      problem: unknown;
      round: number;
      opponentSocketId?: string;
      playerNames?: Record<string, string>;
      language?: "c" | "cpp";
    }) => {
      if (payload && typeof window !== "undefined") {
        sessionStorage.setItem("algo-royale-game", JSON.stringify(payload));
        router.push(`/game/${code}`);
      }
    };

    socket.on("join_success", handleJoinSuccess);
    socket.on("player_joined", handlePlayerJoined);
    socket.on("player_ready", handlePlayerReady);
    socket.on("game_start", handleGameStart);
    socket.emit("join_room", code);

    return () => {
      socket.off("join_success", handleJoinSuccess);
      socket.off("player_joined", handlePlayerJoined);
      socket.off("player_ready", handlePlayerReady);
      socket.off("game_start", handleGameStart);
    };
  }, [code, router, socket]);

  useEffect(() => {
    if (ready) {
      socket.emit("set_language", language);
    }
  }, [language, ready, socket]);

  const handleReady = () => {
    if (iAmReady) return;
    setIAmReady(true);
    socket.emit("player_ready");
  };

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0d1b1e]">
        <p className="font-sans text-[#00ff41]">Joining lobby...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0d1b1e] p-8">
      <main className="flex w-full max-w-lg flex-col gap-8">
        <h1 className="font-sans text-2xl text-[#00ff41] text-center">
          Lobby: {code}
        </h1>

        <div className="nes-container with-title is-dark">
          <p className="title text-[#00ff41]">Players</p>
          <p className="font-sans text-[#00ff41]">
            {playerCount} / 2
          </p>
          {players.length > 0 && (
            <ul className="font-sans mt-2 list-none space-y-1 text-sm text-[#00ff41]/90">
              {players.map((p) => (
                <li key={p.socketId}>
                  {p.name ?? "Anonymous"}
                  {p.ready && " ✓ Ready"}
                  {p.language && ` (${p.language === "c" ? "C" : "C++"})`}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="nes-container with-title is-dark">
          <p className="title text-[#00ff41]">Language</p>
          <div className="flex gap-2">
            <button
              className={`nes-btn ${language === "cpp" ? "is-primary" : ""}`}
              onClick={() => setLanguage("cpp")}
              disabled={iAmReady}
            >
              C++
            </button>
            <button
              className={`nes-btn ${language === "c" ? "is-primary" : ""}`}
              onClick={() => setLanguage("c")}
              disabled={iAmReady}
            >
              C
            </button>
          </div>
        </div>

        {isHost && (
          <div className="nes-container with-title is-dark">
            <p className="title text-[#00ff41]">Difficulty</p>
            <div className="flex flex-wrap gap-2">
              {(["Easy", "Mid", "Hard"] as Difficulty[]).map((d) => (
                <label key={d} className="nes-cursor">
                  <input
                    type="radio"
                    className="nes-radio is-dark"
                    name="difficulty"
                    checked={difficulty === d}
                    onChange={() => setDifficulty(d)}
                  />
                  <span className="text-[#00ff41]">{d}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        <button
          className={`nes-btn is-primary w-full ${
            playerCount < 2 || iAmReady ? "is-disabled" : ""
          }`}
          onClick={handleReady}
          disabled={playerCount < 2 || iAmReady}
        >
          {iAmReady ? "Ready ✓" : "Ready"}
        </button>

        {playerCount < 2 && (
          <p className="font-sans text-center text-sm text-[#00ff41]/70">
            Waiting for opponent...
          </p>
        )}
        {playerCount >= 2 && !iAmReady && (
          <p className="font-sans text-center text-sm text-[#00ff41]/70">
            Select language and click Ready
          </p>
        )}
        {playerCount >= 2 && iAmReady && (
          <p className="font-sans text-center text-sm text-[#00ff41]/70">
            Waiting for opponent to be ready...
          </p>
        )}

        <Link href="/" className="nes-btn text-center">
          Leave
        </Link>
      </main>
    </div>
  );
}
