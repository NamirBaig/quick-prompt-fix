import type { AnalysisResult, TargetModel } from "./prompt-analysis";
import { createAnalysis, listAnalyses, removeAnalysis } from "./history.functions";

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
  await createAnalysis({
    data: {
      sessionId: getSessionId(),
      prompt,
      optimized_prompt: result.optimized,
      score: result.score,
      complexity: result.complexity,
      model,
      weaknesses: result.weaknesses.map((w) => w.title),
    },
  });
}

export async function fetchHistory(): Promise<AnalysisRecord[]> {
  const rows = await listAnalyses({ data: { sessionId: getSessionId() } });
  return (rows ?? []).map((row) => ({
    ...row,
    weaknesses: Array.isArray(row.weaknesses) ? (row.weaknesses as string[]) : [],
  }));
}

export async function deleteAnalysis(id: string): Promise<void> {
  await removeAnalysis({ data: { sessionId: getSessionId(), id } });
}
