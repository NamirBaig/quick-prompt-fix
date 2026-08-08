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

export function analyzePrompt(
  rawPrompt: string,
  model: TargetModel,
  answerLanguage = "English",
): AnalysisResult {
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

  const { optimized, improvements } = optimizePrompt(prompt, model, xray, vagueHits, answerLanguage);

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

type Domain =
  | "coding"
  | "data"
  | "writing"
  | "marketing"
  | "email"
  | "research"
  | "career"
  | "education"
  | "design"
  | "business"
  | "general";

const DOMAIN_PATTERNS: [Domain, RegExp][] = [
  ["coding", /\b(code|coding|function|bug|debug|refactor|api|typescript|javascript|python|java|rust|react|css|html|regex|algorithm|script|component|test|deploy|docker|git)\b/i],
  ["data", /\b(sql|query|database|dataset|dataframe|analytics|spreadsheet|excel|csv|chart|metric|kpi|statistic|forecast|pandas|table schema)\b/i],
  ["email", /\b(email|e-mail|reply|follow[- ]up|outreach|cold (mail|email)|subject line|inbox|message to)\b/i],
  ["marketing", /\b(marketing|ad|ads|copy|campaign|landing page|seo|social (media|post)|tweet|linkedin post|brand|audience|conversion|newsletter|slogan)\b/i],
  ["career", /\b(resume|cv|cover letter|interview|job (description|application)|hiring|recruiter|career|promotion|salary)\b/i],
  ["research", /\b(research|summar|literature|paper|study|analy[sz]e|compare|evidence|source|report on|investigate|explain why|pros and cons)\b/i],
  ["education", /\b(teach|explain|lesson|student|course|curriculum|quiz|tutorial|beginner|learn|syllabus|homework)\b/i],
  ["design", /\b(image|photo|illustration|logo|render|midjourney|dall[- ]?e|art|poster|ui design|mockup|color palette|3d)\b/i],
  ["business", /\b(business|strategy|revenue|pricing|startup|investor|pitch|roadmap|okr|stakeholder|proposal|budget|market entry)\b/i],
  ["writing", /\b(blog|article|essay|story|script|newsletter|post about|write about|copywriting|caption|headline|book|novel)\b/i],
];

type DomainProfile = {
  role: string;
  contextHints: string;
  audience: string;
  constraints: string[];
  format: string;
  example: string;
};

const DOMAIN_PROFILES: Record<Domain, DomainProfile> = {
  coding: {
    role: "You are a senior software engineer and code reviewer who writes production-grade, well-tested code.",
    contextHints: "language and version, framework, existing file/module structure, error messages or stack traces, and any constraints from the current codebase",
    audience: "an experienced developer who wants working code plus a brief rationale, not a beginner tutorial",
    constraints: [
      "Show complete, runnable code — no pseudo-code or `...` placeholders.",
      "Call out edge cases, failure modes, and performance trade-offs.",
      "If a detail is missing, state the assumption you made instead of inventing an API.",
    ],
    format: "1. One-sentence approach summary\n2. The full code block, commented where non-obvious\n3. A short bullet list of assumptions and edge cases\n4. How to verify or test it",
    example: "```ts\n// approach: single pass, O(n)\nexport function slugify(input: string) { /* ... */ }\n```\nAssumptions: input is UTF-8 and may be empty.",
  },
  data: {
    role: "You are a senior data analyst fluent in SQL, statistics, and turning numbers into decisions.",
    contextHints: "table/column names and types, data volume, the database engine or tool, the time range, and the decision this analysis supports",
    audience: "a stakeholder who needs the insight first and the methodology second",
    constraints: [
      "Show the query or calculation, then the interpretation.",
      "State any assumption about schema, joins, or missing data explicitly.",
      "Never fabricate numbers; describe what the result would show instead.",
    ],
    format: "1. Headline finding in one sentence\n2. The query / calculation in a code block\n3. A table of the expected output columns\n4. Caveats and next analytical step",
    example: "Finding: churn concentrates in month 2.\n```sql\nSELECT date_trunc('month', signup_at) AS cohort, count(*) ...\n```",
  },
  writing: {
    role: "You are an experienced editor and writer with a distinctive, non-generic voice.",
    contextHints: "the publication or platform, the reader, the desired tone, length, and any angle or thesis you already have in mind",
    audience: "readers who skim first — the opening must earn the next paragraph",
    constraints: [
      "No AI clichés: avoid 'in today's fast-paced world', 'delve', 'unlock', 'game-changer'.",
      "Prefer concrete examples and specific detail over abstract claims.",
      "Vary sentence length; keep paragraphs under four lines.",
    ],
    format: "1. A working title plus two alternates\n2. The piece itself with subheadings\n3. A one-line summary usable as a meta description",
    example: "Title: The Quiet Cost of Always-On Standups\nOpening: Most teams don't lose hours to meetings. They lose the twenty minutes before each one.",
  },
  marketing: {
    role: "You are a direct-response marketer who writes copy judged on conversion, not applause.",
    contextHints: "the product, the exact audience segment, the offer, the channel and placement, the primary objection, and the call to action",
    audience: "a skeptical prospect scrolling fast who needs one clear reason to stop",
    constraints: [
      "Lead with the benefit, not the feature.",
      "No superlatives you can't substantiate.",
      "Keep each variant within its channel's practical length limit.",
    ],
    format: "1. Three headline options\n2. Primary body copy\n3. Two shorter variants for A/B testing\n4. The single CTA line",
    example: "Headline: Ship the feature this week, not next quarter.\nCTA: Start free — no card needed.",
  },
  email: {
    role: "You are a communications specialist who writes short, human emails that get replies.",
    contextHints: "who the recipient is, your relationship to them, prior thread history, the outcome you want, and the deadline",
    audience: "a busy recipient who reads the first two lines on a phone",
    constraints: [
      "Keep it under 150 words unless the situation demands more.",
      "One clear ask, placed in the first or last line.",
      "Plain, warm, non-corporate tone — no 'I hope this email finds you well'.",
    ],
    format: "1. Subject line (plus one alternate)\n2. The email body\n3. A one-line follow-up to send if there's no reply",
    example: "Subject: Quick question on the March invoice\nBody: Hi Sam — one thing before Friday: ...",
  },
  research: {
    role: "You are a rigorous research analyst who separates established fact from inference.",
    contextHints: "the scope and time window, which sources or domains count as credible, the depth required, and the decision this feeds",
    audience: "an informed reader who will challenge weak reasoning",
    constraints: [
      "Distinguish clearly between what is well established, contested, and unknown.",
      "Give the reasoning behind each key claim.",
      "Flag where you are uncertain instead of smoothing over gaps.",
    ],
    format: "1. Executive summary (3 bullets)\n2. Findings grouped by theme\n3. Counter-arguments or contradicting evidence\n4. Confidence level and open questions",
    example: "Summary: Evidence is strong on X, mixed on Y.\nContested: the effect size in longitudinal studies varies 2–5x.",
  },
  career: {
    role: "You are a hiring manager and career coach who has screened thousands of candidates.",
    contextHints: "the target role and seniority, the job description, your relevant experience with metrics, and the company's stated priorities",
    audience: "a recruiter spending under 30 seconds on the first pass",
    constraints: [
      "Every claim must be backed by a measurable outcome.",
      "Cut generic traits like 'hard-working' and 'team player'.",
      "Mirror the vocabulary of the target job description.",
    ],
    format: "1. The rewritten content\n2. A bullet list of what changed and why\n3. Three likely follow-up questions this will trigger",
    example: "Before: Responsible for improving performance.\nAfter: Cut p95 API latency 840ms → 210ms across 12 services.",
  },
  education: {
    role: "You are a patient teacher who explains hard ideas with concrete analogies and no jargon creep.",
    contextHints: "the learner's current level, what they already know, the time available, and how the learning will be assessed",
    audience: "a motivated learner encountering this topic for the first time",
    constraints: [
      "Introduce one new concept at a time, building on the previous.",
      "Define every technical term the first time it appears.",
      "Include a check-for-understanding question after each section.",
    ],
    format: "1. Plain-language overview\n2. Step-by-step explanation with an analogy\n3. A worked example\n4. Three practice questions with answers",
    example: "Analogy: A database index is the book's index — you skip to page 212 instead of reading all 400 pages.",
  },
  design: {
    role: "You are an art director who writes precise visual briefs and generation prompts.",
    contextHints: "the subject, mood, medium or art style, lighting, colour palette, composition, aspect ratio, and anything to exclude",
    audience: "an image model or illustrator that needs unambiguous visual direction",
    constraints: [
      "Be explicit about composition, lighting, and colour — never leave them implied.",
      "State a negative list of what must not appear.",
      "Specify aspect ratio and rendering style.",
    ],
    format: "1. The main generation prompt (one dense paragraph)\n2. A negative prompt line\n3. Two stylistic variations",
    example: "Prompt: overhead shot of a walnut desk, warm morning side light, muted earth palette, 35mm, shallow depth of field, 3:2.",
  },
  business: {
    role: "You are a strategy consultant who gives decisive recommendations with the reasoning attached.",
    contextHints: "the company stage and size, the market, the numbers you already have, constraints on budget or timeline, and who decides",
    audience: "a decision-maker who wants a recommendation, not a menu of options",
    constraints: [
      "Commit to a recommendation and defend it.",
      "Quantify impact and risk wherever possible.",
      "Name the assumptions the recommendation depends on.",
    ],
    format: "1. Recommendation in one sentence\n2. The reasoning in 3–5 bullets\n3. Risks and mitigations\n4. First three concrete actions with owners and timing",
    example: "Recommendation: hold pricing, unbundle onboarding as a paid tier.\nRisk: churn in the SMB segment; mitigate with a 6-month grandfather.",
  },
  general: {
    role: "You are an expert practitioner in the subject of this request, with deep hands-on experience.",
    contextHints: "your situation, what you've already tried, any constraints, and what a successful answer would let you do next",
    audience: "a knowledgeable but time-poor reader who wants actionable substance, not filler",
    constraints: [
      "Be specific and concrete; avoid generic filler.",
      "Do not invent facts — if something is unknown, say so.",
      "Keep the response focused and skimmable.",
    ],
    format: "1. A one-paragraph summary\n2. Clear section headings\n3. Bullet points for lists\n4. A short 'Next steps' section",
    example: "Summary: <one crisp sentence>\nKey point: <specific, evidence-backed statement>",
  },
};

function detectDomain(prompt: string): Domain {
  let best: Domain = "general";
  let bestHits = 0;
  for (const [domain, re] of DOMAIN_PATTERNS) {
    const hits = (prompt.match(new RegExp(re.source, "gi")) ?? []).length;
    if (hits > bestHits) {
      bestHits = hits;
      best = domain;
    }
  }
  return best;
}

const STOP_WORDS = new Set([
  "write","create","make","give","help","need","want","please","about","that","this","with","from","your","have","will","should","would","could","into","them","they","some","more","most","very","just","like","also","when","what","which","there","their","using","use","can","for","the","and","are","you","our","its","how",
]);

function extractTopic(prompt: string): string {
  const words = prompt
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3 && !STOP_WORDS.has(w));
  const freq = new Map<string, number>();
  for (const w of words) freq.set(w, (freq.get(w) ?? 0) + 1);
  const top = [...freq.entries()]
    .sort((a, b) => b[1] - a[1] || words.indexOf(a[0]) - words.indexOf(b[0]))
    .slice(0, 3)
    .map(([w]) => w);
  return top.join(", ");
}

function cleanTask(prompt: string): string {
  let task = prompt.trim().replace(/\s+/g, " ");
  task = task.replace(
    /^(hey|hi|hello|please|can you|could you|i want you to|i need you to|i want|i need)\s+/i,
    "",
  );
  task = task.charAt(0).toUpperCase() + task.slice(1);
  if (!/[.?!]$/.test(task)) task += ".";
  return task;
}

export function optimizePrompt(
  prompt: string,
  model: TargetModel,
  xray: Record<XRayKey, boolean>,
  vagueHits: string[],
  answerLanguage = "English",
): { optimized: string; improvements: Improvement[] } {
  const improvements: Improvement[] = [];

  const domain = detectDomain(prompt);
  const profile = DOMAIN_PROFILES[domain];
  const topic = extractTopic(prompt);
  const topicLabel = topic || "the subject of this request";
  const task = cleanTask(prompt || "Complete the task described below.");

  const lines: string[] = [];

  // 1. Role — always a real sentence, never a placeholder.
  lines.push(profile.role);
  if (!xray.role) {
    improvements.push({
      title: `Assigned a ${domain === "general" ? "domain expert" : domain} role`,
      detail: `The prompt reads as a ${domain} task, so it now opens by casting the model as ${profile.role
        .replace(/^You are /, "")
        .replace(/\.$/, "")}.`,
    });
  }

  // 2. Task
  lines.push("");
  lines.push("TASK");
  lines.push(task);
  if (!xray.goal) {
    improvements.push({
      title: "Stated the objective explicitly",
      detail: "The request is now a single, unambiguous instruction under its own heading.",
    });
  }

  // 3. Context — written as assertions the model can act on.
  lines.push("");
  lines.push("CONTEXT");
  lines.push(
    `The subject is ${topicLabel}. Treat this as a real ${domain === "general" ? "professional" : domain} task with real stakes. Before answering, take into account ${profile.contextHints}. If any of these are not stated, choose the most reasonable common-case assumption, state it in one line at the top, and continue — do not stop to ask.`,
  );
  if (!xray.context) {
    improvements.push({
      title: "Supplied working context",
      detail: `Added the background a ${domain} task depends on, plus an instruction to assume sensible defaults instead of stalling.`,
    });
  }

  // 4. Audience
  lines.push("");
  lines.push("AUDIENCE");
  lines.push(`Write for ${profile.audience}.`);
  improvements.push({
    title: "Defined the audience",
    detail: `Set to ${profile.audience}, so tone and depth are calibrated instead of generic.`,
  });

  // 5. Constraints
  lines.push("");
  lines.push("REQUIREMENTS");
  const constraints = [...profile.constraints];
  if (vagueHits.length > 0) {
    constraints.push(
      `Be measurable and specific — replace vague qualifiers (${vagueHits.slice(0, 4).join(", ")}) with concrete numbers, names, or criteria.`,
    );
  }
  constraints.push("Do not repeat these instructions back to me; produce only the deliverable.");
  lines.push(constraints.map((c) => `- ${c}`).join("\n"));
  if (!xray.constraints) {
    improvements.push({
      title: "Added guardrails",
      detail: `Constraints typical of ${domain} work, e.g. "${profile.constraints[0]}"`,
    });
  }
  if (vagueHits.length > 0) {
    improvements.push({
      title: "Removed ambiguity",
      detail: `Vague words (${vagueHits.slice(0, 4).join(", ")}) are now countered with a "be measurable" requirement.`,
    });
  }

  // 6. Output format
  lines.push("");
  lines.push("OUTPUT FORMAT");
  lines.push(profile.format);
  if (!xray.format) {
    improvements.push({
      title: "Locked the output structure",
      detail: `A ${domain}-shaped format makes the reply predictable and directly reusable.`,
    });
  }

  // 7. Example
  lines.push("");
  lines.push("EXAMPLE OF THE STYLE EXPECTED");
  lines.push(profile.example);
  if (!xray.examples) {
    improvements.push({
      title: "Anchored with an example",
      detail: "A short, domain-matched sample locks in the expected style and level of detail.",
    });
  }

  // 8. Language
  lines.push("");
  lines.push("LANGUAGE");
  lines.push(`Write the entire response in ${answerLanguage}. Keep technical terms, code, and proper nouns in their original form.`);
  improvements.push({
    title: `Set the answer language to ${answerLanguage}`,
    detail: `The prompt now tells the model to reply in ${answerLanguage} while leaving code and proper nouns untouched.`,
  });

  // 9. Model-specific guidance
  lines.push("");
  lines.push("HOW TO WORK");
  lines.push(MODEL_NOTES[model]);
  improvements.push({
    title: `Tuned for ${model}`,
    detail: `Added working instructions matched to ${model}'s documented strengths.`,
  });

  return { optimized: lines.join("\n"), improvements };
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
