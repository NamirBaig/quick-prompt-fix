import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const insertSchema = z.object({
  prompt: z.string().min(1).max(20000),
  optimized_prompt: z.string().min(1).max(40000),
  score: z.number().int().min(0).max(100),
  complexity: z.string().min(1).max(32),
  model: z.string().min(1).max(32),
  weaknesses: z.array(z.string().max(200)).max(50),
});

const deleteSchema = z.object({ id: z.string().uuid() });

export const listAnalyses = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: rows, error } = await context.supabase
      .from("prompt_analyses")
      .select("id, prompt, optimized_prompt, score, complexity, model, weaknesses, created_at")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error("Could not load history");
    return rows ?? [];
  });

export const createAnalysis = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => insertSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("prompt_analyses").insert({
      user_id: context.userId,
      session_id: context.userId,
      prompt: data.prompt,
      optimized_prompt: data.optimized_prompt,
      score: data.score,
      complexity: data.complexity,
      model: data.model,
      weaknesses: data.weaknesses,
    });
    if (error) throw new Error("Could not save analysis");
    return { ok: true };
  });

export const removeAnalysis = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => deleteSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("prompt_analyses")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error("Could not delete analysis");
    return { ok: true };
  });
