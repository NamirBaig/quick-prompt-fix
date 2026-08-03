import { supabase } from "@/integrations/supabase/client";
import type { AnalysisResult, TargetModel } from "./prompt-analysis";

const KEY = "prompt-doctor-session";

export function getSessionId(): string {
  if (typeof window === "undefined") return "server-session-id";
  let id = window.localStorage.getItem(KEY);
  if (!id) {
    id = (window.crypto?.randomUUID?.() ?? `s-${Date.now()}-${Math.random().toString(36).slice(2)}`)
      .replace(/-/g, "")
      .slice(0, 32);
    window.localStorage.setItem(KEY, id);
  }
  return id;
}

export type AnalysisRecord = {
  id: string;
  prompt: string;
  optimized_prompt: string;
  score: number;
  complexity: string;
  model: string;
  weaknesses: string[];
  created_at: string;
};

export async function saveAnalysis(
  prompt: string,
  model: TargetModel,
  result: AnalysisResult,
): Promise<void> {
  const { error } = await supabase.from("prompt_analyses").insert({
    session_id: getSessionId(),
    prompt,
    optimized_prompt: result.optimized,
    score: result.score,
    complexity: result.complexity,
    model,
    weaknesses: result.weaknesses.map((w) => w.title),
  });
  if (error) throw error;
}

export async function fetchHistory(): Promise<AnalysisRecord[]> {
  const { data, error } = await supabase
    .from("prompt_analyses")
    .select("id, prompt, optimized_prompt, score, complexity, model, weaknesses, created_at")
    .eq("session_id", getSessionId())
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  return (data ?? []).map((row) => ({
    ...row,
    weaknesses: Array.isArray(row.weaknesses) ? (row.weaknesses as string[]) : [],
  }));
}

export async function deleteAnalysis(id: string): Promise<void> {
  const { error } = await supabase.rpc("delete_prompt_analysis", {
    _id: id,
    _session_id: getSessionId(),
  });
  if (error) throw error;
}
