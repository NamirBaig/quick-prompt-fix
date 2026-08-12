import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ChevronDown, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { PageHero } from "@/components/page-hero";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { deleteAnalysis, fetchHistory } from "@/lib/history";
import { SCORE_CLASS, scoreTone, type TargetModel } from "@/lib/prompt-analysis";
import { setPendingPrompt } from "@/lib/prompt-inbox";

export const Route = createFileRoute("/_authenticated/history")({
  head: () => ({
    meta: [
      { title: "History — Prompt Doctor AI" },
      {
        name: "description",
        content:
          "Browse every prompt you've analyzed with its health score and model, reload it into the analyzer, or delete it.",
      },
      { property: "og:title", content: "History — Prompt Doctor AI" },
      {
        property: "og:description",
        content: "Every analyzed prompt, with score, model and the optimized rewrite.",
      },
      { property: "og:url", content: "https://quick-prompt-fix.lovable.app/history" },
      { name: "twitter:title", content: "History — Prompt Doctor AI" },
      {
        name: "twitter:description",
        content: "Every analyzed prompt, with score, model and the optimized rewrite.",
      },
    ],
    links: [{ rel: "canonical", href: "https://quick-prompt-fix.lovable.app/history" }],
  }),
  component: HistoryPage,
});

function HistoryPage() {
  const { data, isLoading } = useQuery({ queryKey: ["history"], queryFn: fetchHistory });
  const [openId, setOpenId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const remove = useMutation({
    mutationFn: deleteAnalysis,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["history"] });
      toast.success("Analysis deleted");
    },
    onError: () => toast.error("Could not delete that analysis."),
  });

  const rows = data ?? [];

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <PageHero
        eyebrow="History"
        title="Every prompt you've diagnosed"
        subtitle="Reopen an analysis to compare the original and optimized versions, or send it straight back into the analyzer."
      />

      {isLoading && <p className="text-sm text-muted-foreground">Loading your history…</p>}
      {!isLoading && rows.length === 0 && (
        <Card className="shadow-soft">
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Nothing here yet. Analyze a prompt and it will show up automatically.
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col gap-3">
        {rows.map((row) => {
          const open = openId === row.id;
          return (
            <Card key={row.id} className="overflow-hidden shadow-soft">
              <CardContent className="p-0">
                <button
                  onClick={() => setOpenId(open ? null : row.id)}
                  className="flex w-full items-center gap-4 px-4 py-4 text-left transition-colors hover:bg-accent/50"
                >
                  <span
                    className={`font-display text-3xl font-bold ${SCORE_CLASS[scoreTone(row.score)]}`}
                  >
                    {row.score}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{row.prompt}</span>
                    <span className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      {new Date(row.created_at).toLocaleString()}
                      <Badge variant="outline" className="text-[10px]">
                        {row.model}
                      </Badge>
                      <Badge variant="secondary" className="text-[10px]">
                        {row.complexity}
                      </Badge>
                    </span>
                  </span>
                  <ChevronDown
                    className={`size-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
                  />
                </button>

                {open && (
                  <div className="space-y-4 border-t border-border bg-muted/30 p-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <Section title="Original prompt" body={row.prompt} />
                      <Section title="Optimized prompt" body={row.optimized_prompt} highlight />
                    </div>
                    {row.weaknesses.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {row.weaknesses.map((w) => (
                          <Badge
                            key={w}
                            variant="outline"
                            className="border-destructive/30 text-destructive"
                          >
                            {w}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          setPendingPrompt(row.prompt, row.model as TargetModel);
                          navigate({ to: "/" });
                        }}
                      >
                        <RotateCcw className="size-4" />
                        Reload into analyzer
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive hover:text-destructive"
                        onClick={() => remove.mutate(row.id)}
                        disabled={remove.isPending}
                      >
                        <Trash2 className="size-4" />
                        Delete
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function Section({ title, body, highlight }: { title: string; body: string; highlight?: boolean }) {
  return (
    <div
      className={`rounded-xl border p-3 ${highlight ? "border-primary/25 bg-primary/5" : "border-border bg-card"}`}
    >
      <p
        className={`mb-2 text-xs font-semibold uppercase tracking-wide ${highlight ? "text-primary" : "text-muted-foreground"}`}
      >
        {title}
      </p>
      <pre className="max-h-64 overflow-auto whitespace-pre-wrap font-sans text-sm leading-relaxed">
        {body}
      </pre>
    </div>
  );
}
