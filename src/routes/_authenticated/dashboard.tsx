import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Activity, Gauge, Trophy, ListChecks } from "lucide-react";

import { PageHero } from "@/components/page-hero";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchHistory } from "@/lib/history";
import { SCORE_CLASS, scoreTone } from "@/lib/prompt-analysis";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Prompt Doctor AI" },
      {
        name: "description",
        content:
          "Track how your prompt quality improves over time: average health score, score trend, and your most common prompt weaknesses.",
      },
      { property: "og:title", content: "Dashboard — Prompt Doctor AI" },
      {
        property: "og:description",
        content: "Average score, score trend and most common weaknesses across your analyzed prompts.",
      },
      { property: "og:url", content: "https://quick-prompt-fix.lovable.app/dashboard" },
      { name: "twitter:title", content: "Dashboard — Prompt Doctor AI" },
      {
        name: "twitter:description",
        content: "Average score, score trend and most common weaknesses across your analyzed prompts.",
      },
    ],
    links: [{ rel: "canonical", href: "https://quick-prompt-fix.lovable.app/dashboard" }],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { data, isLoading } = useQuery({ queryKey: ["history"], queryFn: fetchHistory });
  const rows = data ?? [];

  const total = rows.length;
  const average = total ? Math.round(rows.reduce((s, r) => s + r.score, 0) / total) : 0;
  const best = rows.reduce<(typeof rows)[number] | null>(
    (acc, r) => (!acc || r.score > acc.score ? r : acc),
    null,
  );

  const trend = [...rows]
    .reverse()
    .slice(-20)
    .map((r, i) => ({
      name: `#${i + 1}`,
      score: r.score,
      date: new Date(r.created_at).toLocaleDateString(),
    }));

  const weaknessCounts = new Map<string, number>();
  for (const row of rows) {
    for (const w of row.weaknesses) weaknessCounts.set(w, (weaknessCounts.get(w) ?? 0) + 1);
  }
  const topWeaknesses = [...weaknessCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, count]) => ({ name, count }));

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <PageHero
        eyebrow="Dashboard"
        title="Your prompt health at a glance"
        subtitle="Every analysis is recorded so you can watch your prompt writing measurably improve."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          icon={<Activity className="size-4" />}
          label="Prompts analyzed"
          value={isLoading ? "—" : String(total)}
        />
        <StatCard
          icon={<Gauge className="size-4" />}
          label="Average health score"
          value={isLoading ? "—" : String(average)}
          valueClass={total ? SCORE_CLASS[scoreTone(average)] : ""}
        />
        <StatCard
          icon={<Trophy className="size-4" />}
          label="Best score"
          value={isLoading ? "—" : best ? String(best.score) : "—"}
          valueClass={best ? SCORE_CLASS[scoreTone(best.score)] : ""}
        />
      </div>

      <Card className="rise shadow-card hover-lift">
        <CardHeader>
          <CardTitle className="text-base">Score trend</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          {trend.length < 2 ? (
            <EmptyNote text="Analyze at least two prompts to see your trend." />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend} margin={{ left: -20, right: 8, top: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis domain={[0, 100]} stroke="var(--muted-foreground)" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    color: "var(--popover-foreground)",
                    fontSize: 12,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="var(--chart-1)"
                  strokeWidth={3}
                  dot={{ r: 3, fill: "var(--chart-1)" }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rise shadow-card hover-lift">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ListChecks className="size-4 text-primary" />
              Most common weaknesses
            </CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            {topWeaknesses.length === 0 ? (
              <EmptyNote text="No data yet — run your first analysis." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topWeaknesses} layout="vertical" margin={{ left: 40, right: 12 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                  <XAxis type="number" stroke="var(--muted-foreground)" fontSize={12} allowDecimals={false} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={120}
                    stroke="var(--muted-foreground)"
                    fontSize={11}
                  />
                  <Tooltip
                    cursor={{ fill: "var(--accent)" }}
                    contentStyle={{
                      background: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: 12,
                      color: "var(--popover-foreground)",
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="count" fill="var(--chart-2)" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="rise shadow-card hover-lift">
          <CardHeader>
            <CardTitle className="text-base">Best scoring prompt</CardTitle>
          </CardHeader>
          <CardContent>
            {!best ? (
              <EmptyNote text="No prompts analyzed yet." />
            ) : (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`font-display text-4xl font-bold ${SCORE_CLASS[scoreTone(best.score)]}`}>
                    {best.score}
                  </span>
                  <Badge variant="secondary">{best.complexity}</Badge>
                  <Badge variant="outline">{best.model}</Badge>
                </div>
                <p className="max-h-48 overflow-auto whitespace-pre-wrap rounded-xl border border-border bg-muted/40 p-3 text-sm leading-relaxed">
                  {best.prompt}
                </p>
                <p className="text-xs text-muted-foreground">
                  Analyzed {new Date(best.created_at).toLocaleString()}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  valueClass = "",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <Card className="shadow-soft">
      <CardContent className="flex items-center justify-between py-6">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className={`mt-1 font-display text-4xl font-bold ${valueClass}`}>{value}</p>
        </div>
        <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          {icon}
        </span>
      </CardContent>
    </Card>
  );
}

function EmptyNote({ text }: { text: string }) {
  return (
    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">{text}</div>
  );
}
