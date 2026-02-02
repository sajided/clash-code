export type Difficulty = "Newbie" | "Pupil" | "Specialist" | "Expert" | "Grandmaster";

export type SabotageCard = "fog" | "freeze" | "shuffle" | "shield";

export type CodeLanguage = "c" | "cpp";

export interface SampleTest {
  input: string;
  expectedOutput: string;
}

export interface Problem {
  id: string;
  title: string;
  description: string;
  description_html?: string;
  constraints?: string;
  sampleTests: SampleTest[];
  rating?: number;
  difficulty?: "Easy" | "Medium" | "Hard";
}

export interface Player {
  socketId: string;
  name?: string;
  ready?: boolean;
  language?: CodeLanguage;
  mana: number;
  score: number;
  hasShield: boolean;
  code: string;
}

export type ProblemDifficulty = "Easy" | "Medium" | "Hard";

export interface GameRoom {
  id: string;
  code: string;
  hostSocketId: string;
  difficulty: Difficulty;
  roundRatings: [number, number, number];
  /** Lobby-selected difficulty: all 3 rounds use problems of this level. */
  problemDifficulty?: ProblemDifficulty;
  players: Map<string, Player>;
  round: 1 | 2 | 3;
  problems: [Problem, Problem, Problem] | null;
  winnerSocketId?: string;
  status: "waiting" | "configuring" | "playing" | "finished";
  roundWinner?: string;
}

export interface ClientToServerEvents {
  create_room: (name?: string) => void;
  join_room: (code: string, name?: string) => void;
  set_config: (payload: { roundRatings?: [number, number, number]; problemDifficulty?: ProblemDifficulty }) => void;
  set_language: (language: CodeLanguage) => void;
  player_ready: () => void;
  play_card: (payload: { card: SabotageCard; targetSocketId?: string }) => void;
  submit_code: (code: string, language?: CodeLanguage) => void;
  give_up: () => void;
  update_code: (code: string) => void;
  keystroke_chunk: (charCount: number) => void;
  get_game_state: (code: string) => void;
}

export interface PlayerInfo {
  socketId: string;
  name?: string;
  ready?: boolean;
  language?: CodeLanguage;
}

export interface ServerToClientEvents {
  room_created: (payload: { roomId: string; code: string }) => void;
  join_success: (payload: {
    roomId: string;
    code: string;
    isHost: boolean;
    playerCount: number;
    players: PlayerInfo[];
  }) => void;
  join_error: (message: string) => void;
  player_joined: (payload: { socketId: string; playerCount?: number; players?: PlayerInfo[] }) => void;
  player_ready: (payload: { socketId: string; players?: PlayerInfo[] }) => void;
  game_start: (payload: {
    problem: Problem;
    round: number;
    opponentSocketId?: string;
    playerNames?: Record<string, string>;
    language?: CodeLanguage;
  }) => void;
  apply_effect: (payload: { type: SabotageCard; duration?: number }) => void;
  effect_blocked: () => void;
  mana_update: (payload: { mana: number }) => void;
  round_result: (payload: {
    winnerSocketId: string | null;
    verdict: "Accepted" | "Wrong Answer" | "TLE" | "Compilation Error" | "Runtime Error" | "Give up";
    scores: Record<string, number>;
    nextRound?: number;
    playerNames?: Record<string, string>;
  }) => void;
  game_over: (payload: {
    winnerSocketId: string;
    scores: Record<string, number>;
    playerNames?: Record<string, string>;
  }) => void;
}
