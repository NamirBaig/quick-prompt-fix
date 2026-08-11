import type { TargetModel } from "./prompt-analysis";

export interface AnswerStyle {
  /** Short label shown in the UI. */
  label: string;
  /** One-line description of how the answer will read. */
  blurb: string;
  /** Style instructions injected into the system prompt. */
  instructions: string;
}

export const ANSWER_STYLES: Record<TargetModel, AnswerStyle> = {
  ChatGPT: {
    label: "ChatGPT style",
    blurb: "Structured and friendly — headings, numbered steps, a short wrap-up.",
    instructions: [
      "Answer in the house style of ChatGPT:",
      "- Open with one short framing sentence, never a long preamble.",
      "- Organise the body with bold mini-headings and numbered or bulleted steps.",
      "- Be practical and example-driven; show code or tables when they help.",
      "- Close with a brief 'In short' takeaway and, when natural, offer one follow-up you could do next.",
      "- Tone: warm, helpful, plainly worded, lightly encouraging. No emoji spam.",
    ].join("\n"),
  },
  Claude: {
    label: "Claude style",
    blurb: "Thoughtful prose — reasoned, nuanced, careful about caveats.",
    instructions: [
      "Answer in the house style of Claude:",
      "- Prefer well-formed prose paragraphs over dense bullet lists; use lists only when the content is genuinely a list.",
      "- Think out loud briefly: name the key consideration or tradeoff before giving the answer.",
      "- Be candid about uncertainty and edge cases, but stay decisive — always commit to a recommendation.",
      "- Tone: calm, measured, intellectually careful, respectful of the reader's judgement.",
      "- End with the honest bottom line rather than a summary of everything said.",
    ].join("\n"),
  },
  Gemini: {
    label: "Gemini style",
    blurb: "Scannable and comprehensive — clear sections, tables, key takeaways.",
    instructions: [
      "Answer in the house style of Gemini:",
      "- Lead with a one-or-two-sentence direct answer, then expand.",
      "- Use clear section headings, tight bullet points and comparison tables wherever data is comparable.",
      "- Be comprehensive and well-organised; bold the key terms so the answer is skimmable.",
      "- Where relevant, add a short 'Things to keep in mind' or 'Next steps' section at the end.",
      "- Tone: informative, neutral, encyclopedic but readable.",
    ].join("\n"),
  },
  Copilot: {
    label: "Copilot style",
    blurb: "Terse and build-ready — code first, minimal commentary.",
    instructions: [
      "Answer in the house style of GitHub Copilot:",
      "- Be terse and implementation-first. Skip pleasantries entirely.",
      "- Lead with the code, command, config or concrete artifact in a fenced block with the right language tag.",
      "- Follow with a compact bullet list of only the notes the reader actually needs (assumptions, gotchas, how to run it).",
      "- Prefer working, copy-pasteable output over explanation; no filler, no recap.",
      "- Tone: direct, technical, developer-to-developer.",
    ].join("\n"),
  },
};

export function answerStyleInstructions(model: TargetModel): string {
  return (ANSWER_STYLES[model] ?? ANSWER_STYLES.ChatGPT).instructions;
}
