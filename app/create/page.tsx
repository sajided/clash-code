"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSocket } from "@/components/SocketProvider";

export default function CreatePage() {
  const router = useRouter();
  const socket = useSocket();
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const handleRoomCreated = (payload: { roomId: string; code: string }) => {
      router.push(`/lobby/${payload.code}`);
    };

    socket.on("room_created", handleRoomCreated);
    return () => {
      socket.off("room_created", handleRoomCreated);
    };
  }, [router, socket]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim() || "Player 1";
    setCreating(true);
    socket.emit("create_room", trimmed);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0d1b1e] p-8">
      <main className="flex w-full max-w-md flex-col items-center gap-8">
        <h1 className="font-sans text-2xl text-[#00ff41]">Create Room</h1>
        <form onSubmit={handleSubmit} className="flex w-full flex-col gap-4">
          <div className="nes-field">
            <label htmlFor="name" className="text-[#00ff41]">
              Your Name
            </label>
            <input
              id="name"
              type="text"
              className="nes-input"
              placeholder="Player 1"
              maxLength={20}
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={creating}
            />
          </div>
          <div className="flex gap-4">
            <button
              type="submit"
              className="nes-btn is-primary flex-1"
              disabled={creating}
            >
              {creating ? "Creating..." : "Create Room"}
            </button>
            <Link href="/" className="nes-btn">
              Cancel
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
}
