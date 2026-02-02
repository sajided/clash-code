import type { CodeLanguage, GameRoom, Problem, SabotageCard } from "./types.js";

const CARD_COSTS: Record<SabotageCard, number> = {
  fog: 2,
  freeze: 3,
  shuffle: 4,
  shield: 3,
};

const MAX_MANA = 5;
const INITIAL_MANA = 0;
const CHARS_PER_HALF_MANA = 20;
const MANA_FROM_CHUNK = 0.5;

export function generateRoomCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function createRoom(hostSocketId: string, name?: string): GameRoom {
  const code = generateRoomCode();
  const room: GameRoom = {
    id: crypto.randomUUID(),
    code,
    hostSocketId,
    difficulty: "Pupil",
    roundRatings: [800, 1200, 1600],
    problemDifficulty: "Medium",
    players: new Map([
      [
        hostSocketId,
        {
          socketId: hostSocketId,
          name: name ?? "Player 1",
          ready: false,
          language: "cpp",
          mana: INITIAL_MANA,
          score: 0,
          hasShield: false,
          code: "",
        },
      ],
    ]),
    round: 1,
    problems: null,
    status: "waiting",
  };
  return room;
}

export function addPlayerToRoom(room: GameRoom, socketId: string, name?: string): boolean {
  if (room.players.size >= 2) return false;
  if (room.players.has(socketId)) return true;
  room.players.set(socketId, {
    socketId,
    name: name ?? "Player 2",
    ready: false,
    language: "cpp",
    mana: INITIAL_MANA,
    score: 0,
    hasShield: false,
    code: "",
  });
  return true;
}

export function getPlayerInfos(room: GameRoom): { socketId: string; name?: string; ready?: boolean; language?: CodeLanguage }[] {
  return [...room.players.values()].map((p) => ({
    socketId: p.socketId,
    name: p.name,
    ready: p.ready,
    language: p.language,
  }));
}

export function getPlayerNames(room: GameRoom): Record<string, string> {
  const names: Record<string, string> = {};
  for (const [sid, p] of room.players) {
    names[sid] = p.name ?? sid.slice(0, 8);
  }
  return names;
}

export function getRoomByCode(rooms: Map<string, GameRoom>, code: string): GameRoom | undefined {
  for (const room of rooms.values()) {
    if (room.code === code) return room;
  }
  return undefined;
}

export function getRoomBySocket(rooms: Map<string, GameRoom>, socketId: string): GameRoom | undefined {
  for (const room of rooms.values()) {
    if (room.players.has(socketId)) return room;
  }
  return undefined;
}

export function canPlayCard(room: GameRoom, socketId: string, card: SabotageCard, targetSocketId?: string): boolean {
  const player = room.players.get(socketId);
  if (!player) return false;
  const cost = CARD_COSTS[card];
  if (player.mana < cost) return false;
  if (card === "shield") return true;
  const target = targetSocketId ? room.players.get(targetSocketId) : undefined;
  return !!target && target.socketId !== socketId;
}

export function playSabotageCard(
  room: GameRoom,
  socketId: string,
  card: SabotageCard,
  targetSocketId?: string
): { applied: boolean } {
  const player = room.players.get(socketId);
  if (!player) return { applied: false };
  const cost = CARD_COSTS[card];
  if (player.mana < cost) return { applied: false };

  if (card === "shield") {
    player.mana -= cost;
    player.hasShield = true;
    return { applied: true };
  }

  const target = targetSocketId ? room.players.get(targetSocketId) : undefined;
  if (!target || target.socketId === socketId) return { applied: false };

  if (target.hasShield) {
    target.hasShield = false;
    player.mana -= cost;
    return { applied: false };
  }

  player.mana -= cost;
  return { applied: true };
}

export function resetRoundMana(room: GameRoom): void {
  for (const player of room.players.values()) {
    player.mana = INITIAL_MANA;
    player.hasShield = false;
    player.code = "";
  }
}

/** Grant mana from keystroke chunk. 20 valid chars = +0.5 mana (PRD §3). */
export function addManaFromKeystrokes(
  room: GameRoom,
  socketId: string,
  charCount: number
): { mana: number } | null {
  const player = room.players.get(socketId);
  if (!player || player.mana >= MAX_MANA) return null;
  const chunks = Math.floor(charCount / CHARS_PER_HALF_MANA);
  if (chunks <= 0) return null;
  const add = Math.min(chunks * MANA_FROM_CHUNK, MAX_MANA - player.mana);
  player.mana = Math.min(MAX_MANA, player.mana + add);
  return { mana: player.mana };
}

export { CARD_COSTS, MAX_MANA, INITIAL_MANA };
