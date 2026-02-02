"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { Socket } from "socket.io-client";
import { createSocket } from "@/lib/socket";

const SocketContext = createContext<Socket | null>(null);

export function SocketProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const s = createSocket();
    setSocket(s);
    return () => {
      s.disconnect();
    };
  }, []);

  if (!socket) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0d1b1e]">
        <p className="font-sans text-[#00ff41]">Connecting...</p>
      </div>
    );
  }

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
}

export function useSocket() {
  const socket = useContext(SocketContext);
  if (!socket) {
    throw new Error("useSocket must be used within SocketProvider");
  }
  return socket;
}

export function useSocketOptional() {
  return useContext(SocketContext);
}
