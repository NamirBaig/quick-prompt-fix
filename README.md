# Prompt Doctor AI

Build "Prompt Doctor AI" — a polished web app that analyzes and improves prompts written for LLMs like ChatGPT, Gemini, Claude, and Copilot.

TAGLINE: "Transform weak prompts into powerful AI instructions."

CORE FLOW (main page):

1. A text area where users paste or type a prompt (plus a dropdown to pick a target model: ChatGPT, Gemini, Claude, Copilot)

2. An "Analyze Prompt" button that runs analysis and shows:

   - Prompt Health Score (0–100) as a large, color-coded number (red <50, amber 50–69, lime 70–84, green 85+)

   - Complexity badge: Beginner / Intermediate / Advanced

   - "Prompt X-Ray": a checklist showing whether the prompt has a Role, Context, Goal, Output Format, Constraints, and Examples (green check or red X for each)

   - A list of detected weaknesses (e.g. "Missing context", "No role assigned", "Ambiguous wording", "Missing output format") shown as red-accented cards

   - A side-by-side comparison: Original Prompt vs. Optimized Prompt, with an "Improvement %" and estimated response quality (Poor/Fair/Good/Excellent)

   - A list of "Improvements Applied" explaining each change in plain language, shown as green-accented cards

   - A "Copy Optimized Prompt" button and a "Download PDF Report" button

ANALYSIS LOGIC: Use rule-based heuristics (keyword/pattern matching) to detect the presence of role, context, goal, constraints, output format, and examples in the prompt text. Score = 60 pts for structural elements present (10 each) + 25 pts inversely proportional to weakness count + 15 pts for reasonable prompt length. The optimizer rewrites the prompt by appending missing sections (Role, Context, Audience, Constraints, Output Format, Example) in a clean structured format, plus a short note tailored to the selected target model's best practices.

ADDITIONAL PAGES (sidebar navigation):

- Dashboard: charts showing total prompts analyzed, average score, score trend over time, most common weaknesses, and best-scoring prompt

- History: a list of past analyzed prompts (date, score, model) that can be expanded to view original/optimized text, reloaded into the analyzer, or deleted

- Templates: a browsable library of starter prompts grouped into categories (Resume, Coding, Research, Marketing, Email, SQL, Python, Business, Education, Blogging, Interview Prep, Image Generation) — clicking "Use this template" loads it into the analyzer

DATA: Persist analyzed prompts (prompt, optimized_prompt, score, complexity, model, weaknesses, timestamp) using Supabase so history and dashboard stats survive reloads.

DESIGN: Clean, modern SaaS aesthetic. Indigo-to-purple gradient hero header (#4f46e5 → #7c3aed). Card-based layout with soft shadows and rounded corners. Use a medical/diagnostic visual motif subtly (a stethoscope icon 🩺, "health score" framing) without being cartoonish. Fully responsive for mobile and desktop. Dark mode support is a nice-to-have.

Keep the whole thing fast and self-contained — no external LLM API required for the core analysis, so it works instantly without API keys.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://quick-prompt-fix.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/41e84d20-ce5f-4358-88b6-14831b10e6f1).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
