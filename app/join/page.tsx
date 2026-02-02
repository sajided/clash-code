"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSocket } from "@/components/SocketProvider";

export default function JoinPage() {
  const router = useRouter();
  const socket = useSocket();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = code.trim().replace(/\D/g, "").slice(0, 6);
    if (trimmed.length !== 6) {
      setError("Enter a 6-digit room code");
      return;
    }
    setError(null);
    setJoining(true);
    const playerName = name.trim() || "Player 2";

    const handleSuccess = (payload: { isHost?: boolean; playerCount?: number; players?: { socketId: string; name?: string }[] }) => {
      if (typeof window !== "undefined" && payload) {
        sessionStorage.setItem(
          "algo-royale-lobby",
          JSON.stringify({
            code: trimmed,
            isHost: payload.isHost ?? false,
            playerCount: payload.playerCount ?? 2,
            players: payload.players ?? [],
          })
        );
      }
      router.push(`/lobby/${trimmed}`);
    };

    const handleError = (message: string) => {
      setError(message);
      setJoining(false);
    };

    socket.once("join_success", handleSuccess);
    socket.once("join_error", handleError);
    socket.emit("join_room", trimmed, playerName);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0d1b1e] p-8">
      <main className="flex w-full max-w-md flex-col items-center gap-8">
        <h1 className="font-sans text-2xl text-[#00ff41]">Join Room</h1>
        <form onSubmit={handleSubmit} className="flex w-full flex-col gap-4">
          <div className="nes-field">
            <label htmlFor="name" className="text-[#00ff41]">
              Your Name
            </label>
            <input
              id="name"
              type="text"
              className="nes-input"
              placeholder="Player 2"
              maxLength={20}
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={joining}
            />
          </div>
          <div className="nes-field">
            <label htmlFor="code" className="text-[#00ff41]">
              Room Code
            </label>
            <input
              id="code"
              type="text"
              className="nes-input"
              placeholder="000000"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              disabled={joining}
            />
          </div>
          {error && <p className="font-sans text-sm text-[#ff005c]">{error}</p>}
          <div className="flex gap-4">
            <button
              type="submit"
              className="nes-btn is-primary flex-1"
              disabled={joining}
            >
              {joining ? "Joining..." : "Join"}
            </button>
            <Link href="/" className="nes-btn">
              Back
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
}
