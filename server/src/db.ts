import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL ?? "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY ?? "";

export const supabase: SupabaseClient | null =
  supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey)
    : null;

export interface ProblemRow {
  id: string;
  title: string;
  description_html: string | null;
  difficulty: string;
  sample_input: string | null;
  sample_output: string | null;
  sample_tests: { input: string; expectedOutput: string }[] | null;
}
