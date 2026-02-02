"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { Socket } from "socket.io-client";
import { createSocket } from "@/lib/socket";

const SocketContext = createContext<Socket | null>(null);

export function SocketProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);

  useEffect(() => {
    const s = createSocket();
    setSocket(s);
    setConnected(s.connected);
    setConnectError(null);

    const onConnect = () => {
      setConnected(true);
      setConnectError(null);
    };
    const onDisconnect = () => setConnected(false);
    const onConnectError = (err: Error) => {
      setConnectError(err.message || "Connection failed");
    };

    s.on("connect", onConnect);
    s.on("disconnect", onDisconnect);
    s.on("connect_error", onConnectError);

    return () => {
      s.off("connect", onConnect);
      s.off("disconnect", onDisconnect);
      s.off("connect_error", onConnectError);
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

  if (connectError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#0d1b1e] p-8 text-center">
        <p className="font-sans text-[#ff4444]">Cannot connect to server</p>
        <p className="font-sans text-sm text-[#00ff41]/80">{connectError}</p>
        <p className="font-sans text-xs text-[#00ff41]/60">
          Check NEXT_PUBLIC_SOCKET_URL and backend CORS (FRONTEND_URL) settings.
        </p>
      </div>
    );
  }

  if (!connected) {
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
