/**
 * Offline fallback: a fully local, rule-based answer builder plus a small
 * localStorage cache of previous online answers. No network, no API key.
 */

const CACHE_KEY = "pd_answer_cache_v1";
const MAX_CACHE = 50;

type CacheEntry = { key: string; answer: string; at: number };

function hashKey(prompt: string, language: string) {
  return `${language}::${prompt.trim().slice(0, 400)}`;
}

function readCache(): CacheEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as CacheEntry[]) : [];
  } catch {
    return [];
  }
}

export function getCachedAnswer(prompt: string, language: string): string | null {
  const key = hashKey(prompt, language);
  return readCache().find((e) => e.key === key)?.answer ?? null;
}

export function cacheAnswer(prompt: string, language: string, answer: string) {
  if (typeof window === "undefined" || !answer.trim()) return;
  const key = hashKey(prompt, language);
  const next = [{ key, answer, at: Date.now() }, ...readCache().filter((e) => e.key !== key)].slice(
    0,
    MAX_CACHE,
  );
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(next));
  } catch {
    // storage full — ignore
  }
}

const STOPWORDS = new Set([
  "the","a","an","and","or","but","for","with","that","this","these","those","from","into","about",
  "your","you","our","their","have","has","will","would","should","could","must","can","it","its",
  "please","write","create","make","give","need","want","help","using","use","then","than","also",
]);

function keywords(prompt: string, limit = 8) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const w of prompt.toLowerCase().match(/[a-z][a-z0-9+#.-]{2,}/g) ?? []) {
    if (STOPWORDS.has(w) || seen.has(w)) continue;
    seen.add(w);
    out.push(w);
    if (out.length >= limit) break;
  }
  return out;
}

function firstSentence(prompt: string) {
  const s = prompt.trim().split(/(?<=[.!?])\s+/)[0] ?? prompt.trim();
  return s.length > 180 ? `${s.slice(0, 177)}…` : s;
}

/**
 * Builds a structured working answer entirely on-device. It is a planning /
 * outline answer rather than generated prose, so it stays useful with no
 * internet connection.
 */
export function buildOfflineAnswer(prompt: string, model: string): string {
  const topic = firstSentence(prompt);
  const kws = keywords(prompt);
  const focus = kws.length ? kws.slice(0, 5).join(", ") : "the request above";

  return [
    "## Offline answer",
    "",
    `You are currently offline, so this answer was produced on your device instead of by ${model}. It gives you a complete working structure you can act on now, and you can re-run it online later for a full written answer.`,
    "",
    "### What is being asked",
    topic,
    "",
    "### Key elements detected",
    ...(kws.length ? kws.map((k) => `- ${k}`) : ["- No strong keywords detected"]),
    "",
    "### Step-by-step approach",
    `1. Define the exact outcome for: ${focus}.`,
    "2. Gather the inputs, facts or data the task depends on.",
    "3. Draft the core content or solution, one section at a time.",
    "4. Check it against every requirement in the prompt.",
    "5. Tighten wording, formatting and length before sharing.",
    "",
    "### Suggested answer outline",
    "- **Opening** — a one-line summary of the result.",
    `- **Body** — the main work, organised around ${focus}.`,
    "- **Details** — examples, numbers, or code where relevant.",
    "- **Close** — next steps, caveats, or a call to action.",
    "",
    "### Things to double-check",
    "- Is the audience and tone right?",
    "- Are the constraints (length, format, style) respected?",
    "- Is anything assumed that should be verified?",
    "",
    "_Reconnect and press “Get the answer” again for a full AI-written response._",
  ].join("\n");
}
