import type { Metadata } from "next";
import { Press_Start_2P, VT323 } from "next/font/google";
import { SocketProvider } from "@/components/SocketProvider";
import "./globals.css";

const pressStart = Press_Start_2P({
  weight: "400",
  variable: "--font-press-start",
  subsets: ["latin"],
});

const vt323 = VT323({
  weight: "400",
  variable: "--font-vt323",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Algo Royale",
  description: "1v1 competitive programming with sabotage mechanics",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${pressStart.variable} ${vt323.variable} crt-overlay antialiased`}
      >
        <SocketProvider>{children}</SocketProvider>
      </body>
    </html>
  );
}
