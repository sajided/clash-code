"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useSocket } from "@/components/SocketProvider";
import { playCardSound, playVictorySound, playSubmitSound } from "@/lib/sound";

const MonacoEditor = dynamic(
  () => import("@monaco-editor/react").then((mod) => mod.default),
  { ssr: false }
);

interface Problem {
  id: string;
  title: string;
  description: string;
  constraints?: string;
  sampleTests: { input: string; expectedOutput: string }[];
}

type SabotageCard = "fog" | "freeze" | "shuffle" | "shield";
type CodeLanguage = "c" | "cpp";

const CARD_COSTS: Record<SabotageCard, number> = {
  fog: 2,
  freeze: 3,
  shuffle: 4,
  shield: 3,
};

const CPP_TEMPLATE = `#include <iostream>
using namespace std;

int main() {
    // Your code here
    return 0;
}`;

const C_TEMPLATE = `#include <stdio.h>

int main() {
    // Your code here
    return 0;
}`;

export default function GamePage() {
  const params = useParams();
  const router = useRouter();
  const socket = useSocket();
  const code =
    (params.code as string) ??
    (typeof window !== "undefined"
      ? window.location.pathname.split("/").pop() ?? ""
      : "");

  const [problem, setProblem] = useState<Problem | null>(null);
  const [round, setRound] = useState(1);
  const [language, setLanguage] = useState<CodeLanguage>("cpp");
  const [editorCode, setEditorCode] = useState(CPP_TEMPLATE);
  const [mana, setMana] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [verdict, setVerdict] = useState<string | null>(null);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [gameOver, setGameOver] = useState<{ winner: string } | null>(null);
  const [opponentSocketId, setOpponentSocketId] = useState<string | null>(null);
  const [playerNames, setPlayerNames] = useState<Record<string, string>>({});
  const [effects, setEffects] = useState<{ type: SabotageCard; duration: number } | null>(null);
  const [frozen, setFrozen] = useState(false);
  const [blinded, setBlinded] = useState(false);
  const [shuffleEffect, setShuffleEffect] = useState(false);
  const [showCrownAnim, setShowCrownAnim] = useState(false);
  const [opponentStatus, setOpponentStatus] = useState<"Typing..." | "Frozen" | "Running...">("Typing...");
  const [muted, setMuted] = useState(false);
  const mutedRef = useRef(muted);
  mutedRef.current = muted;
  const editorCodeRef = useRef(CPP_TEMPLATE);
  const manaAccumulatorRef = useRef(0);
  const prevCodeLengthRef = useRef(0);
  const lastChunkRef = useRef("");

  useEffect(() => {
    const applyGameStart = (payload: {
      problem: Problem;
      round: number;
      opponentSocketId?: string;
      playerNames?: Record<string, string>;
      language?: CodeLanguage;
    }) => {
      const lang = payload.language ?? "cpp";
      const template = lang === "c" ? C_TEMPLATE : CPP_TEMPLATE;
      setProblem(payload.problem);
      setRound(payload.round);
      if (payload.opponentSocketId) setOpponentSocketId(payload.opponentSocketId);
      if (payload.playerNames) setPlayerNames(payload.playerNames);
      setLanguage(lang);
      setVerdict(null);
      setSubmitting(false);
      setEditorCode(template);
      editorCodeRef.current = template;
      prevCodeLengthRef.current = template.length;
      manaAccumulatorRef.current = 0;
      lastChunkRef.current = "";
    };

    const handleGameStart = applyGameStart;

    socket.on("game_start", handleGameStart);

    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("algo-royale-game");
      if (stored) {
        try {
          const payload = JSON.parse(stored) as {
            problem: Problem;
            round: number;
            opponentSocketId?: string;
            playerNames?: Record<string, string>;
            language?: CodeLanguage;
          };
          if (payload.playerNames) setPlayerNames(payload.playerNames);
          applyGameStart(payload);
          setTimeout(() => sessionStorage.removeItem("algo-royale-game"), 100);
        } catch {
          sessionStorage.removeItem("algo-royale-game");
        }
      } else if (code && /^\d{6}$/.test(code)) {
        socket.emit("get_game_state", code);
      }
    }

    const handleManaUpdate = (payload: { mana: number }) => {
      setMana(payload.mana);
    };

    const handleEffectBlocked = () => {
      setVerdict("Blocked by Shield!");
      setTimeout(() => setVerdict(null), 2000);
    };

    const handleApplyEffect = (payload: { type: SabotageCard; duration?: number }) => {
      const duration = payload.duration ?? 3;
      setEffects({ type: payload.type, duration });
      if (payload.type === "freeze") {
        setFrozen(true);
        setTimeout(() => setFrozen(false), duration * 1000);
      }
      if (payload.type === "fog") {
        setBlinded(true);
        setTimeout(() => setBlinded(false), duration * 1000);
      }
      if (payload.type === "shuffle") {
        const code = editorCodeRef.current;
        const lines = code.split("\n");
        if (lines.length >= 2) {
          const i = Math.floor(Math.random() * lines.length);
          let j = Math.floor(Math.random() * lines.length);
          if (j === i) j = (j + 1) % lines.length;
          [lines[i], lines[j]] = [lines[j], lines[i]];
          const newCode = lines.join("\n");
          editorCodeRef.current = newCode;
          setEditorCode(newCode);
          socket.emit("update_code", newCode);
        }
        setShuffleEffect(true);
        setTimeout(() => setShuffleEffect(false), 800);
      }
    };

    const handleRoundResult = (payload: {
      winnerSocketId: string | null;
      verdict: string;
      scores: Record<string, number>;
      nextRound?: number;
      playerNames?: Record<string, string>;
    }) => {
      setSubmitting(false);
      setVerdict(payload.verdict);
      setScores(payload.scores);
      if (payload.playerNames) setPlayerNames(payload.playerNames);
      if (payload.winnerSocketId && socket.id && payload.winnerSocketId === socket.id) {
        setShowCrownAnim(true);
        setTimeout(() => setShowCrownAnim(false), 900);
      }
    };

    const handleGameOver = (payload: {
      winnerSocketId: string;
      scores: Record<string, number>;
      playerNames?: Record<string, string>;
    }) => {
      setGameOver({ winner: payload.winnerSocketId });
      setScores(payload.scores);
      if (payload.playerNames) setPlayerNames(payload.playerNames);
      setSubmitting(false);
      if (!mutedRef.current) playVictorySound();
    };

    socket.on("mana_update", handleManaUpdate);
    socket.on("apply_effect", handleApplyEffect);
    socket.on("effect_blocked", handleEffectBlocked);
    socket.on("round_result", handleRoundResult);
    socket.on("game_over", handleGameOver);

    return () => {
      socket.off("game_start", handleGameStart);
      socket.off("mana_update", handleManaUpdate);
      socket.off("apply_effect", handleApplyEffect);
      socket.off("effect_blocked", handleEffectBlocked);
      socket.off("round_result", handleRoundResult);
      socket.off("game_over", handleGameOver);
    };
  }, [socket, code]);

  const handleSubmit = useCallback(() => {
    if (submitting) return;
    setSubmitting(true);
    if (!mutedRef.current) playSubmitSound();
    socket.emit("submit_code", editorCode, language);
  }, [editorCode, language, submitting, socket]);

  const handleEditorChange = useCallback(
    (value: string | undefined) => {
      const next = value ?? "";
      editorCodeRef.current = next;
      setEditorCode(next);
      socket.emit("update_code", next);

      const prevLen = prevCodeLengthRef.current;
      const added = Math.max(0, next.length - prevLen);
      prevCodeLengthRef.current = next.length;
      if (added <= 0) return;

      const tail = next.slice(-Math.min(added, 40));
      lastChunkRef.current = (lastChunkRef.current + tail).slice(-40);
      manaAccumulatorRef.current += added;

      const CODE_KEYWORDS = /int|for|return|main|void|if|else|while|cin|cout|scanf|printf|#include/;
      const hasVariety = (s: string) => new Set(s.replace(/\s/g, "")).size >= 2;
      const isSpam = (s: string) => s.length >= 10 && !hasVariety(s) && !CODE_KEYWORDS.test(s);

      while (manaAccumulatorRef.current >= 20) {
        const chunk = lastChunkRef.current.slice(-20);
        if (!isSpam(chunk)) {
          socket.emit("keystroke_chunk", 20);
        }
        manaAccumulatorRef.current -= 20;
      }
    },
    [socket]
  );

  const handlePlayCard = useCallback(
    (card: SabotageCard, targetSocketId?: string) => {
      if (mana < CARD_COSTS[card]) return;
      if (card !== "shield" && !targetSocketId) return;
      if (!mutedRef.current) playCardSound();
      if (card === "freeze" && targetSocketId) {
        setOpponentStatus("Frozen");
        setTimeout(() => setOpponentStatus("Typing..."), 3000);
      }
      socket.emit("play_card", { card, targetSocketId });
    },
    [mana, socket]
  );

  const opponentName = opponentSocketId ? (playerNames[opponentSocketId] ?? "Opponent") : "Opponent";
  const myName = (socket.id ? playerNames[socket.id] : null) ?? "You";
  const winnerName =
    gameOver?.winner === socket.id
      ? myName
      : gameOver?.winner
        ? (playerNames[gameOver.winner] ?? "Opponent")
        : "Opponent";

  const scoresByNames = Object.entries(scores)
    .map(([sid, n]) => `${playerNames[sid] ?? sid.slice(0, 8)}: ${n}`)
    .join(", ");

  if (gameOver) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#0d1b1e] p-8">
        <main className="flex flex-col items-center gap-8">
          <h1 className="font-sans text-2xl text-[#00ff41]">Game Over!</h1>
          <p className="font-sans text-[#ff005c]">
            Winner: {gameOver.winner === socket.id ? "You!" : winnerName}
          </p>
          <p className="font-sans text-sm text-[#00ff41]/80">
            Final scores: {scoresByNames || "—"}
          </p>
          <Link href="/" className="nes-btn is-primary">
            Back to Home
          </Link>
        </main>
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0d1b1e]">
        <p className="font-sans text-[#00ff41]">Waiting for game to start...</p>
      </div>
    );
  }

  const myScore = socket.id ? scores[socket.id] ?? 0 : 0;
  const oppScore = opponentSocketId ? scores[opponentSocketId] ?? 0 : 0;
  const myTowersStanding = [1, 2, 3].map((r) => oppScore < r);
  const MAX_MANA = 5;
  const isSuddenDeath = round === 3 && myScore === 1 && oppScore === 1;

  return (
    <div className="flex h-screen flex-col bg-[#0d1b1e]">
      <header className="flex items-center justify-between border-b border-[#00ff41]/30 px-4 py-2">
        <h1 className="font-sans text-lg text-[#00ff41]">
          {isSuddenDeath ? "Round 3 — Sudden Death" : `Round ${round}`} | {problem.title}
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-sans text-xs text-[#00ff41]/80">
            Language: {language === "c" ? "C" : "C++"}
          </span>
          <button
            className="nes-btn"
            onClick={() => setMuted((m) => !m)}
            title={muted ? "Unmute" : "Mute"}
          >
            {muted ? "Unmute" : "Mute"}
          </button>
          <span className="font-sans text-sm text-[#00ff41]/80">
            {myName}: {myScore} — {opponentName}: {oppScore}
          </span>
        </div>
      </header>

      <div className="grid flex-1 grid-cols-2 overflow-hidden border-t border-[#00ff41]/20">
        {/* Left: You — mana bar, cards, editor, console */}
        <div className="flex flex-col border-r border-[#00ff41]/20">
          <div className="flex flex-wrap items-center gap-2 border-b border-[#00ff41]/20 px-3 py-2">
            <span className="font-sans text-xs text-[#00ff41]">MANA:</span>
            <div className="flex gap-0.5" aria-label={`Mana ${mana} of ${MAX_MANA}`}>
              {Array.from({ length: MAX_MANA }, (_, i) => (
                <span
                  key={i}
                  className={`h-3 w-4 rounded-sm border ${
                    i < mana ? "border-[#00ff41] bg-[#00ff41]/80" : "border-[#00ff41]/40 bg-[#00ff41]/10"
                  }`}
                />
              ))}
            </div>
            <span className="font-sans text-xs text-[#00ff41]">
              ({mana}/{MAX_MANA})
            </span>
            <div className="flex gap-1">
              <button
                className="nes-btn"
                onClick={() => handlePlayCard("fog", opponentSocketId ?? undefined)}
                disabled={mana < 2 || !opponentSocketId}
              >
                Fog (2)
              </button>
              <button
                className="nes-btn"
                onClick={() => handlePlayCard("freeze", opponentSocketId ?? undefined)}
                disabled={mana < 3 || !opponentSocketId}
              >
                Freeze (3)
              </button>
              <button
                className="nes-btn"
                onClick={() => handlePlayCard("shuffle", opponentSocketId ?? undefined)}
                disabled={mana < 4 || !opponentSocketId}
              >
                Shuffle (4)
              </button>
              <button
                className="nes-btn"
                onClick={() => handlePlayCard("shield")}
                disabled={mana < 3}
              >
                Shield (3)
              </button>
            </div>
          </div>

          <div className="relative flex flex-1 min-h-0 flex-col">
          {blinded && (
            <div
              className="absolute inset-0 z-10 bg-black"
              style={{ pointerEvents: "none" }}
            />
          )}
          {shuffleEffect && (
            <div
              className="pointer-events-none absolute inset-0 z-10 opacity-90"
              style={{
                background: "linear-gradient(90deg, transparent 0%, rgba(255,0,0,0.15) 33%, transparent 66%, rgba(0,0,255,0.15) 100%)",
                mixBlendMode: "screen",
                animation: "glitch 0.4s ease-out",
              }}
              aria-hidden
            />
          )}
          <div className="flex-1">
            <MonacoEditor
              height="100%"
              language={language === "c" ? "c" : "cpp"}
              value={editorCode}
              onChange={handleEditorChange}
              options={{
                readOnly: frozen,
                minimap: { enabled: false },
                contextmenu: false,
                fontSize: 20,
                fontFamily: "var(--font-vt323), VT323, monospace",
                theme: "vs-dark",
                wordWrap: "on",
              }}
              onMount={(editor) => {
                editor.addAction({
                  id: "no-paste",
                  label: "Block Paste",
                  keybindings: [2048 | 86],
                  run: () => {},
                });
                const disposable = editor.onKeyDown((e) => {
                  if ((e.ctrlKey || e.metaKey) && e.keyCode === 86) {
                    e.preventDefault();
                    e.stopPropagation();
                  }
                });
                const el = editor.getContainerDomNode();
                const onPaste = (e: ClipboardEvent) => {
                  e.preventDefault();
                  e.stopPropagation();
                };
                el.addEventListener("paste", onPaste, { capture: true });
                return () => {
                  disposable.dispose();
                  el.removeEventListener("paste", onPaste, { capture: true });
                };
              }}
            />
          </div>
          <div className="border-t border-[#00ff41]/20 px-3 py-2 font-mono text-xs text-[#00ff41]/90">
            <span className="font-sans text-[#00ff41]/80">CONSOLE / OUTPUT </span>
            {verdict != null ? (
              <span className={verdict === "Accepted" ? "text-[#00ff41]" : "text-[#ff005c]"}>
                {" "}
                {submitting ? "> Compiling..." : `> ${verdict}`}
              </span>
            ) : (
              <span className="text-[#00ff41]/60"> {submitting ? "> Compiling..." : "> Ready"}</span>
            )}
          </div>
          </div>
        </div>

        {/* Right: Opponent — status, HP, problem desc, tower score */}
        <div className="relative flex flex-col overflow-hidden">
          <div className="flex flex-wrap items-center gap-3 border-b border-[#00ff41]/20 px-3 py-2">
            <span className="font-sans text-xs text-[#00ff41]">
              STATUS: {opponentStatus}
            </span>
            <span className="font-sans text-xs text-[#00ff41]">HP: Alive</span>
          </div>
          <aside className="flex-1 overflow-auto border-b border-[#00ff41]/20 p-4">
            <div className="prose prose-invert max-w-none">
              <h2 className="font-sans text-xl text-[#00ff41]">{problem.title}</h2>
              <p className="font-sans text-sm text-[#00ff41]/90 whitespace-pre-wrap">
                {problem.description}
              </p>
              {problem.constraints && (
                <p className="font-sans text-xs text-[#00ff41]/70">
                  Constraints: {problem.constraints}
                </p>
              )}
              <h3 className="font-sans text-sm text-[#00ff41]">Sample I/O</h3>
              {problem.sampleTests.map((t, i) => (
                <div key={i} className="mb-4 rounded border border-[#00ff41]/30 p-2 font-mono text-xs">
                  <p className="text-[#00ff41]/80">Input:</p>
                  <pre className="whitespace-pre-wrap">{t.input}</pre>
                  <p className="text-[#00ff41]/80">Expected:</p>
                  <pre className="whitespace-pre-wrap">{t.expectedOutput}</pre>
                </div>
              ))}
            </div>
          </aside>
          <div className="flex items-center gap-2 px-3 py-2">
            <span className="font-sans text-xs text-[#00ff41]">TOWER SCORE</span>
            <div className="flex gap-1">
              {myTowersStanding.map((standing, i) => (
                <span key={i} className="text-lg" title={standing ? "Tower standing" : "Tower destroyed"}>
                  {standing ? "👑" : "❌"}
                </span>
              ))}
            </div>
          </div>
          {showCrownAnim && (
            <div className="crown-anim" aria-hidden>
              👑
            </div>
          )}
        </div>
      </div>

      <footer className="flex items-center justify-end gap-4 border-t border-[#00ff41]/30 px-4 py-2">
        {verdict && (
          <span
            className={`font-sans text-sm ${
              verdict === "Accepted" ? "text-[#00ff41]" : verdict === "Give up" ? "text-[#00ff41]/80" : "text-[#ff005c]"
            }`}
          >
            {verdict}
          </span>
        )}
        <button
          className="nes-btn"
          onClick={() => socket.emit("give_up")}
          disabled={submitting}
          title="Forfeit this round to opponent"
        >
          Give up
        </button>
        <button
          className="nes-btn is-primary"
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? "Running..." : "RUN"}
        </button>
      </footer>
    </div>
  );
}
