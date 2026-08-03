export type TargetModel = "ChatGPT" | "Gemini" | "Claude" | "Copilot";

export const TARGET_MODELS: TargetModel[] = ["ChatGPT", "Gemini", "Claude", "Copilot"];

export type Complexity = "Beginner" | "Intermediate" | "Advanced";

export type XRayKey = "role" | "context" | "goal" | "format" | "constraints" | "examples";

export const XRAY_LABELS: Record<XRayKey, string> = {
  role: "Role",
  context: "Context",
  goal: "Goal",
  format: "Output Format",
  constraints: "Constraints",
  examples: "Examples",
};

export type Weakness = { title: string; detail: string };
export type Improvement = { title: string; detail: string };

export type AnalysisResult = {
  score: number;
  complexity: Complexity;
  xray: Record<XRayKey, boolean>;
  weaknesses: Weakness[];
  improvements: Improvement[];
  optimized: string;
  improvementPercent: number;
  quality: "Poor" | "Fair" | "Good" | "Excellent";
  wordCount: number;
};

const PATTERNS: Record<XRayKey, RegExp[]> = {
  role: [
    /\b(you are|act as|acting as|as an? (expert|professional|senior|experienced)|assume the role|imagine you|pretend you|your role)\b/i,
    /\b(persona|behave like|you're an?)\b/i,
  ],
  context: [
    /\b(context|background|currently|i am|i'm|we are|we're|my (team|company|project|goal|audience)|given that|for a|working on|the situation)\b/i,
  ],
  goal: [
    /\b(write|create|generate|summar(y|ize|ise)|explain|analyz|analys|build|design|draft|list|compare|translate|refactor|debug|optimi[sz]e|review|plan|help me|i need|produce|rewrite)\b/i,
  ],
  format: [
    /\b(format|bullet points?|numbered list|table|markdown|json|yaml|csv|xml|paragraphs?|headings?|sections?|word (count|limit)|no more than \d+|in \d+ (words|sentences|bullets)|output as|respond (in|with)|step[- ]by[- ]step)\b/i,
  ],
  constraints: [
    /\b(don'?t|do not|avoid|must not|never|only|limit|at most|at least|maximum|minimum|keep it|no more than|within|exclude|ensure|require[ds]?|tone should|constraints?)\b/i,
  ],
  examples: [
    /\b(for example|e\.g\.|example:|examples:|such as|here'?s an example|sample|like this:|few[- ]shot)\b/i,
  ],
};

const VAGUE_WORDS = [
  "good",
  "nice",
  "better",
  "stuff",
  "things",
  "some",
  "etc",
  "anything",
  "somehow",
  "quickly",
  "properly",
];

const MODEL_NOTES: Record<TargetModel, string> = {
  ChatGPT:
    "Think through the task step by step before answering, and ask me clarifying questions first if any requirement is ambiguous.",
  Gemini:
    "Ground the answer in verifiable facts, cite the reasoning behind key claims, and clearly separate facts from assumptions.",
  Claude:
    "Reason carefully inside <thinking> tags before you answer, then give the final response in clean, well-structured prose.",
  Copilot:
    "Prefer concrete, runnable code with inline comments, follow idiomatic conventions for the language, and note any assumptions.",
};

function has(text: string, key: XRayKey): boolean {
  return PATTERNS[key].some((re) => re.test(text));
}

export function analyzePrompt(rawPrompt: string, model: TargetModel): AnalysisResult {
  const prompt = rawPrompt.trim();
  const words = prompt.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  const xray: Record<XRayKey, boolean> = {
    role: has(prompt, "role"),
    context: has(prompt, "context") && wordCount >= 12,
    goal: has(prompt, "goal"),
    format: has(prompt, "format"),
    constraints: has(prompt, "constraints"),
    examples: has(prompt, "examples"),
  };

  const weaknesses: Weakness[] = [];
  if (!xray.role)
    weaknesses.push({
      title: "No role assigned",
      detail: "The model has no persona to adopt, so it defaults to a generic, average-quality voice.",
    });
  if (!xray.context)
    weaknesses.push({
      title: "Missing context",
      detail: "There is no background on your situation, audience, or goal, forcing the model to guess.",
    });
  if (!xray.goal)
    weaknesses.push({
      title: "Unclear objective",
      detail: "No explicit action verb states what you actually want produced.",
    });
  if (!xray.format)
    weaknesses.push({
      title: "Missing output format",
      detail: "Without a requested structure, the response length and shape will be unpredictable.",
    });
  if (!xray.constraints)
    weaknesses.push({
      title: "No constraints",
      detail: "Nothing bounds tone, length, or what to avoid, so the model may over- or under-deliver.",
    });
  if (!xray.examples)
    weaknesses.push({
      title: "No examples provided",
      detail: "A short example dramatically improves how closely the output matches your expectation.",
    });

  const lowered = prompt.toLowerCase();
  const vagueHits = VAGUE_WORDS.filter((w) => new RegExp(`\\b${w}\\b`).test(lowered));
  if (vagueHits.length > 0)
    weaknesses.push({
      title: "Ambiguous wording",
      detail: `Vague terms detected (${vagueHits.slice(0, 4).join(", ")}). Replace them with measurable specifics.`,
    });

  if (wordCount < 8)
    weaknesses.push({
      title: "Prompt too short",
      detail: "Very short prompts leave too much room for interpretation. Aim for at least 25–40 words.",
    });
  if (wordCount > 400)
    weaknesses.push({
      title: "Prompt too long",
      detail: "Extremely long prompts bury the key instruction. Tighten it and move detail into sections.",
    });
  if (prompt.length > 0 && !/[.?!:\n]/.test(prompt))
    weaknesses.push({
      title: "No sentence structure",
      detail: "The prompt reads as one unpunctuated fragment, which makes the instruction harder to parse.",
    });

  const structurePoints = (Object.values(xray).filter(Boolean).length as number) * 10;
  const weaknessPoints = Math.max(0, Math.round(25 - weaknesses.length * (25 / 9)));
  const lengthPoints =
    wordCount >= 30 && wordCount <= 250
      ? 15
      : wordCount >= 15 && wordCount < 30
        ? 10
        : wordCount >= 8 && wordCount < 15
          ? 6
          : wordCount > 250 && wordCount <= 400
            ? 9
            : 2;

  const score = Math.max(0, Math.min(100, structurePoints + weaknessPoints + lengthPoints));

  const presentCount = Object.values(xray).filter(Boolean).length;
  const complexity: Complexity =
    presentCount >= 5 && wordCount >= 60
      ? "Advanced"
      : presentCount >= 3 || wordCount >= 30
        ? "Intermediate"
        : "Beginner";

  const { optimized, improvements } = optimizePrompt(prompt, model, xray, vagueHits);

  const improvementPercent = Math.max(5, Math.round(((100 - score) / Math.max(score, 20)) * 55));
  const projected = Math.min(99, score + Math.round((100 - score) * 0.8));
  const quality =
    projected >= 85 ? "Excellent" : projected >= 70 ? "Good" : projected >= 50 ? "Fair" : "Poor";

  return {
    score,
    complexity,
    xray,
    weaknesses,
    improvements,
    optimized,
    improvementPercent,
    quality,
    wordCount,
  };
}

function optimizePrompt(
  prompt: string,
  model: TargetModel,
  xray: Record<XRayKey, boolean>,
  vagueHits: string[],
): { optimized: string; improvements: Improvement[] } {
  const improvements: Improvement[] = [];
  const sections: string[] = [];

  if (!xray.role) {
    sections.push(
      "## Role\nYou are a senior domain expert with 10+ years of hands-on experience in the subject of this request.",
    );
    improvements.push({
      title: "Added an expert role",
      detail: "Giving the model a specific persona raises the depth and confidence of its answer.",
    });
  }

  if (!xray.context) {
    sections.push(
      "## Context\nDescribe the relevant background here: what already exists, what has been tried, and any tools, data, or systems involved.",
    );
    improvements.push({
      title: "Added a context section",
      detail: "A dedicated slot for background stops the model from inventing assumptions.",
    });
  }

  sections.push(`## Task\n${prompt || "State the task clearly here."}`);
  if (!xray.goal) {
    improvements.push({
      title: "Reframed the request as an explicit task",
      detail: "The instruction is now stated as a single, clear objective under its own heading.",
    });
  }

  sections.push(
    "## Audience\nWrite for a knowledgeable but time-poor reader who wants actionable substance, not filler.",
  );
  improvements.push({
    title: "Defined the target audience",
    detail: "Naming the reader lets the model calibrate tone, vocabulary, and depth.",
  });

  if (!xray.constraints) {
    sections.push(
      "## Constraints\n- Be specific and concrete; avoid generic filler.\n- Do not invent facts. If something is unknown, say so.\n- Keep the response focused and skimmable.",
    );
    improvements.push({
      title: "Added explicit constraints",
      detail: "Boundaries on accuracy, tone, and length prevent rambling or fabricated detail.",
    });
  }

  if (!xray.format) {
    sections.push(
      "## Output Format\nRespond in Markdown with:\n1. A one-paragraph summary\n2. Clear section headings\n3. Bullet points for lists\n4. A short 'Next steps' section at the end",
    );
    improvements.push({
      title: "Specified an output format",
      detail: "A defined structure makes the response predictable and easy to reuse.",
    });
  }

  if (!xray.examples) {
    sections.push(
      "## Example\nExample of the style expected:\n> Summary: <one crisp sentence>\n> Key point: <specific, evidence-backed statement>",
    );
    improvements.push({
      title: "Added a worked example",
      detail: "One short example anchors the model to the exact style and level of detail you want.",
    });
  }

  if (vagueHits.length > 0) {
    sections.push(
      `## Precision Notes\nReplace vague terms with measurable criteria. Ambiguous words found in the original: ${vagueHits.slice(0, 6).join(", ")}.`,
    );
    improvements.push({
      title: "Flagged ambiguous wording",
      detail: "Vague words were called out so the model asks for or assumes measurable specifics.",
    });
  }

  sections.push(`## Model Guidance (${model})\n${MODEL_NOTES[model]}`);
  improvements.push({
    title: `Tuned for ${model}`,
    detail: `Appended guidance that matches ${model}'s documented strengths and prompting best practices.`,
  });

  return { optimized: sections.join("\n\n"), improvements };
}

export function scoreTone(score: number): "critical" | "warn" | "ok" | "great" {
  if (score < 50) return "critical";
  if (score < 70) return "warn";
  if (score < 85) return "ok";
  return "great";
}

export const SCORE_CLASS: Record<ReturnType<typeof scoreTone>, string> = {
  critical: "text-score-critical",
  warn: "text-score-warn",
  ok: "text-score-ok",
  great: "text-score-great",
};

export const SCORE_RING: Record<ReturnType<typeof scoreTone>, string> = {
  critical: "border-score-critical/40 bg-score-critical/10",
  warn: "border-score-warn/40 bg-score-warn/10",
  ok: "border-score-ok/40 bg-score-ok/10",
  great: "border-score-great/40 bg-score-great/10",
};
