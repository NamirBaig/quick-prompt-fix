import { createFileRoute } from "@tanstack/react-router";

type AnswerRequestBody = {
  prompt?: unknown;
  model?: unknown;
  language?: unknown;
};

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

export const Route = createFileRoute("/api/answer")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as AnswerRequestBody;
        const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
        const model = typeof body.model === "string" ? body.model : "ChatGPT";
        const language = typeof body.language === "string" ? body.language : "English";

        if (prompt.length < 3) {
          return new Response("A prompt is required", { status: 400 });
        }

        const key = process.env["LOVABLE_API_KEY"];
        if (!key) {
          return new Response("AI is not configured", { status: 500 });
        }

        const upstream = await fetch(GATEWAY_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${key}`,
          },
          body: JSON.stringify({
            model: "google/gemini-3.6-flash",
            stream: true,
            messages: [
              {
                role: "system",
                content:
                  `You are Prompt Doctor's built-in assistant. Answer the user's prompt fully and directly, ` +
                  `as ${model} would. Use clear Markdown-style structure with short headings and bullet points. ` +
                  `Write the answer in ${language}, keeping technical terms and code in English.`,
              },
              { role: "user", content: prompt },
            ],
          }),
        });

        if (upstream.status === 429) {
          return new Response("Rate limit reached. Please try again in a moment.", { status: 429 });
        }
        if (upstream.status === 402) {
          return new Response("AI credits exhausted. Please add credits to continue.", {
            status: 402,
          });
        }
        if (!upstream.ok || !upstream.body) {
          return new Response("The AI service failed to respond.", { status: 502 });
        }

        // Re-emit as plain text chunks so the client can render tokens as they arrive.
        const decoder = new TextDecoder();
        const encoder = new TextEncoder();
        let buffer = "";

        const stream = new ReadableStream<Uint8Array>({
          async start(controller) {
            const reader = upstream.body!.getReader();
            try {
              for (;;) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n");
                buffer = lines.pop() ?? "";
                for (const line of lines) {
                  const trimmed = line.trim();
                  if (!trimmed.startsWith("data:")) continue;
                  const payload = trimmed.slice(5).trim();
                  if (!payload || payload === "[DONE]") continue;
                  try {
                    const parsed = JSON.parse(payload) as {
                      choices?: { delta?: { content?: string } }[];
                    };
                    const text = parsed.choices?.[0]?.delta?.content;
                    if (text) controller.enqueue(encoder.encode(text));
                  } catch {
                    // ignore malformed keep-alive chunks
                  }
                }
              }
            } finally {
              controller.close();
            }
          },
        });

        return new Response(stream, {
          headers: {
            "content-type": "text/plain; charset=utf-8",
            "cache-control": "no-cache",
          },
        });
      },
    },
  },
});
