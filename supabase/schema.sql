-- Algo Royale Supabase Schema (PRD §5.1)
-- Run this when setting up Supabase for problem storage

-- Problems table: PRD columns for Easy/Medium/Hard per round
CREATE TABLE IF NOT EXISTS problems (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description_html TEXT,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
  sample_input TEXT,
  sample_output TEXT,
  sample_tests JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Match history (optional, for leaderboards)
CREATE TABLE IF NOT EXISTS match_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code TEXT,
  winner_id TEXT,
  scores JSONB,
  rounds INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fetching by difficulty
CREATE INDEX IF NOT EXISTS idx_problems_difficulty ON problems (difficulty);
