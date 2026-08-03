import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const sessionSchema = z.object({ sessionId: z.string().min(8).max(64) });

const insertSchema = sessionSchema.extend({
  prompt: z.string().min(1).max(20000),
  optimized_prompt: z.string().min(1).max(40000),
  score: z.number().int().min(0).max(100),
  complexity: z.string().min(1).max(32),
  model: z.string().min(1).max(32),
  weaknesses: z.array(z.string().max(200)).max(50),
});

const deleteSchema = sessionSchema.extend({ id: z.string().uuid() });

export const listAnalyses = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => sessionSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("prompt_analyses")
      .select("id, prompt, optimized_prompt, score, complexity, model, weaknesses, created_at")
      .eq("session_id", data.sessionId)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error("Could not load history");
    return rows ?? [];
  });

export const createAnalysis = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => insertSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("prompt_analyses").insert({
      session_id: data.sessionId,
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
  .inputValidator((input: unknown) => deleteSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("prompt_analyses")
      .delete()
      .eq("id", data.id)
      .eq("session_id", data.sessionId);
    if (error) throw new Error("Could not delete analysis");
    return { ok: true };
  });
