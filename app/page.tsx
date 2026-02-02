import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0d1b1e] p-8">
      <main className="flex flex-col items-center gap-12 text-center">
        <h1 className="font-sans text-4xl font-bold text-[#00ff41] sm:text-5xl md:text-6xl">
          Clash Code 
        </h1>
        <p className="font-sans max-w-lg text-sm text-[#00ff41]/90">
          1v1 competitive programming. Solve problems. Sabotage your opponent.
        </p>
        <div className="flex flex-col gap-4 sm:flex-row">
          <Link href="/create" className="nes-btn is-primary">
            Create Room
          </Link>
          <Link href="/join" className="nes-btn">
            Join Room
          </Link>
        </div>
      </main>
    </div>
  );
}
