import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import type { Problem, SampleTest } from "./types.js";

const MERGED_JSON_PATH =
  process.env.MERGED_PROBLEMS_JSON_PATH ||
  resolve(process.cwd(), "merged_problems.json");

export type ProblemDifficulty = "Easy" | "Medium" | "Hard";

interface MergedExample {
  example_num?: number;
  example_text?: string;
  images?: string[];
}

interface MergedQuestion {
  title: string;
  problem_id?: string;
  frontend_id?: string;
  difficulty: string;
  problem_slug?: string;
  description?: string;
  examples?: MergedExample[];
  constraints?: string[];
}

interface MergedFile {
  questions?: MergedQuestion[];
}

/** Extract input and expected output from LeetCode-style example_text. */
function parseExampleText(exampleText: string): SampleTest | null {
  if (!exampleText || typeof exampleText !== "string") return null;
  const inputMatch = exampleText.match(/Input:\s*([\s\S]*?)(?=\nOutput:)/i);
  const outputMatch = exampleText.match(/\nOutput:\s*([\s\S]*?)(?=\nExplanation:|\n\n|$)/i);
  if (!outputMatch) return null;
  const input = inputMatch ? inputMatch[1].trim() : "";
  const expectedOutput = outputMatch[1].trim();
  return { input, expectedOutput };
}

function mapMergedToProblem(q: MergedQuestion): Problem {
  const id = q.problem_id ?? q.frontend_id ?? q.problem_slug ?? crypto.randomUUID();
  const sampleTests: SampleTest[] = [];
  if (Array.isArray(q.examples)) {
    for (const ex of q.examples) {
      const parsed = ex.example_text ? parseExampleText(ex.example_text) : null;
      if (parsed && (parsed.input || parsed.expectedOutput)) {
        sampleTests.push(parsed);
      }
    }
  }
  const difficulty = q.difficulty === "Easy" || q.difficulty === "Medium" || q.difficulty === "Hard"
    ? q.difficulty
    : "Medium";
  return {
    id: String(id),
    title: q.title ?? "Untitled",
    description: q.description ?? "",
    constraints: Array.isArray(q.constraints) ? q.constraints.join("\n") : undefined,
    sampleTests: sampleTests.length > 0 ? sampleTests : [{ input: "", expectedOutput: "" }],
    difficulty,
  };
}

let cached: Problem[] | null = null;

/** Load and parse merged_problems.json. Returns [] if file missing or invalid. */
export function loadMergedProblems(): Problem[] {
  if (cached !== null) return cached;
  try {
    if (!existsSync(MERGED_JSON_PATH)) {
      console.warn("[merged-problems] File not found:", MERGED_JSON_PATH);
      cached = [];
      return cached;
    }
    const raw = readFileSync(MERGED_JSON_PATH, "utf-8");
    const data = JSON.parse(raw) as MergedFile;
    const questions = data.questions ?? [];
    const problems = questions
      .filter((q) => q.difficulty === "Easy" || q.difficulty === "Medium" || q.difficulty === "Hard")
      .map(mapMergedToProblem)
      .filter((p) => p.sampleTests.length > 0 && p.sampleTests.some((t) => t.input !== "" || t.expectedOutput !== ""));
    cached = problems;
    console.log("[merged-problems] Loaded", problems.length, "problems from", MERGED_JSON_PATH);
    return cached;
  } catch (err) {
    console.warn("[merged-problems] Load failed:", err);
    cached = [];
    return cached;
  }
}

/** Get one random problem of the given difficulty from merged JSON. */
export function getProblemByDifficultyFromMerged(
  difficulty: ProblemDifficulty
): Problem | null {
  const pool = loadMergedProblems();
  const filtered = pool.filter((p) => p.difficulty === difficulty);
  if (filtered.length === 0) return null;
  return filtered[Math.floor(Math.random() * filtered.length)];
}
