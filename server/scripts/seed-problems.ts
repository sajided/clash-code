import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { HARDCODED_PROBLEMS } from "../src/problems.js";
import type { Problem } from "../src/types.js";

const supabaseUrl = process.env.SUPABASE_URL ?? "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY ?? "";

function ratingToDifficulty(rating: number): "Easy" | "Medium" | "Hard" {
  if (rating <= 1000) return "Easy";
  if (rating <= 1400) return "Medium";
  return "Hard";
}

function problemToRow(p: Problem): {
  id: string;
  title: string;
  description_html: string;
  difficulty: string;
  sample_input: string | null;
  sample_output: string | null;
  sample_tests: { input: string; expectedOutput: string }[];
} {
  const first = p.sampleTests[0];
  return {
    id: p.id,
    title: p.title,
    description_html: p.description ?? "",
    difficulty: ratingToDifficulty(p.rating ?? 800),
    sample_input: first?.input ?? null,
    sample_output: first?.expectedOutput ?? null,
    sample_tests: p.sampleTests,
  };
}

async function main() {
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Set SUPABASE_URL and SUPABASE_SERVICE_KEY in .env");
    process.exit(1);
  }
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const rows = HARDCODED_PROBLEMS.map(problemToRow);
  const { data, error } = await supabase.from("problems").upsert(rows, {
    onConflict: "id",
  });
  if (error) {
    console.error("Seed failed:", error);
    process.exit(1);
  }
  console.log(`Seeded ${rows.length} problems.`);
}

main();
