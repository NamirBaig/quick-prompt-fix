import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Wand2 } from "lucide-react";

import { PageHero } from "@/components/page-hero";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TEMPLATE_CATEGORIES, TEMPLATES } from "@/lib/templates";
import { setPendingPrompt } from "@/lib/prompt-inbox";

export const Route = createFileRoute("/_authenticated/templates")({
  head: () => ({
    meta: [
      { title: "Prompt Templates — Prompt Doctor AI" },
      {
        name: "description",
        content:
          "A starter library of prompts for resumes, coding, research, marketing, SQL, Python and more. Load one into the analyzer and optimize it instantly.",
      },
      { property: "og:title", content: "Prompt Templates — Prompt Doctor AI" },
      {
        property: "og:description",
        content: "Browse starter prompts by category and optimize them in one click.",
      },
      { property: "og:url", content: "https://quick-prompt-fix.lovable.app/templates" },
      { name: "twitter:title", content: "Prompt Templates — Prompt Doctor AI" },
      {
        name: "twitter:description",
        content: "Browse starter prompts by category and optimize them in one click.",
      },
    ],
    links: [{ rel: "canonical", href: "https://quick-prompt-fix.lovable.app/templates" }],
  }),
  component: TemplatesPage,
});

function TemplatesPage() {
  const [active, setActive] = useState<string>("All");
  const navigate = useNavigate();

  const filtered = active === "All" ? TEMPLATES : TEMPLATES.filter((t) => t.category === active);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <PageHero
        eyebrow="Templates"
        title="Starter prompts, ready to diagnose"
        subtitle="Pick a template as a starting point, then let Prompt Doctor rewrite it into a fully structured instruction."
      />

      <div className="flex flex-wrap gap-2">
        {["All", ...TEMPLATE_CATEGORIES].map((cat) => (
          <Button
            key={cat}
            size="sm"
            variant={active === cat ? "default" : "outline"}
            onClick={() => setActive(cat)}
            className="rounded-full"
          >
            {cat}
          </Button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((t) => (
          <Card key={t.title} className="rise hover-lift flex flex-col shadow-soft">
            <CardContent className="flex flex-1 flex-col gap-3 py-5">
              <span className="w-fit rounded-full bg-accent px-2.5 py-1 text-[11px] font-medium text-accent-foreground">
                {t.category}
              </span>
              <p className="font-display text-sm font-semibold">{t.title}</p>
              <p className="flex-1 text-xs leading-relaxed text-muted-foreground">{t.prompt}</p>
              <Button
                size="sm"
                variant="secondary"
                className="w-full"
                onClick={() => {
                  setPendingPrompt(t.prompt);
                  navigate({ to: "/" });
                }}
              >
                <Wand2 className="size-4" />
                Use this template
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
