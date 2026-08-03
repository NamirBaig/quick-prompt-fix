import type { TargetModel } from "./prompt-analysis";

type Pending = { prompt: string; model?: TargetModel } | null;

let pending: Pending = null;

export function setPendingPrompt(prompt: string, model?: TargetModel) {
  pending = { prompt, model };
}

export function takePendingPrompt(): Pending {
  const value = pending;
  pending = null;
  return value;
}
