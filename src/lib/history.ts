import type { AnalysisResult, TargetModel } from "./prompt-analysis";
import { createAnalysis, listAnalyses, removeAnalysis } from "./history.functions";

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
  const rows = await listAnalyses();
  return (rows ?? []).map((row) => ({
    ...row,
    weaknesses: Array.isArray(row.weaknesses) ? (row.weaknesses as string[]) : [],
  }));
}

export async function deleteAnalysis(id: string): Promise<void> {
  await removeAnalysis({ data: { id } });
}
