import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  Copy,
  Download,
  FileDown,
  Loader2,
  Sparkles,
  Stethoscope,
  TriangleAlert,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { AnswerPanel } from "@/components/answer-panel";
import { PageHero } from "@/components/page-hero";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  analyzePrompt,
  SCORE_CLASS,
  SCORE_RING,
  scoreTone,
  TARGET_MODELS,
  XRAY_LABELS,
  type AnalysisResult,
  type TargetModel,
  type XRayKey,
} from "@/lib/prompt-analysis";
import { saveAnalysis } from "@/lib/history";
import { downloadReport } from "@/lib/pdf-report";
import { takePendingPrompt } from "@/lib/prompt-inbox";
import { useI18n, type Dict } from "@/lib/i18n";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Prompt Doctor AI — Fix & Optimize AI Prompts" },
      {
        name: "description",
        content:
          "Paste any ChatGPT, Gemini, Claude or Copilot prompt to get a health score, see what's missing, and copy a stronger, paste-ready rewrite in seconds.",
      },
      { property: "og:title", content: "Prompt Doctor AI — Fix & Optimize AI Prompts" },
      {
        property: "og:description",
        content: "Paste any ChatGPT, Gemini, Claude or Copilot prompt to get a health score, see what's missing, and copy a stronger, paste-ready rewrite in seconds.",
      },
    ],
  }),
  component: Analyzer,
});

const XRAY_I18N: Record<XRayKey, keyof Dict> = {
  role: "xrayRole",
  context: "xrayContext",
  goal: "xrayGoal",
  format: "xrayFormat",
  constraints: "xrayConstraints",
  examples: "xrayExamples",
};

const QUALITY_TONE: Record<string, string> = {
  Poor: "text-score-critical",
  Fair: "text-score-warn",
  Good: "text-score-ok",
  Excellent: "text-score-great",
};

function Analyzer() {
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState<TargetModel>("ChatGPT");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [analyzedPrompt, setAnalyzedPrompt] = useState("");
  const [running, setRunning] = useState(false);
  const [copied, setCopied] = useState(false);
  const queryClient = useQueryClient();
  const { t, languageName } = useI18n();

  useEffect(() => {
    const pending = takePendingPrompt();
    if (pending) {
      setPrompt(pending.prompt);
      if (pending.model) setModel(pending.model);
    }
  }, []);

  const save = useMutation({
    mutationFn: (payload: { prompt: string; model: TargetModel; result: AnalysisResult }) =>
      saveAnalysis(payload.prompt, payload.model, payload.result),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["history"] });
    },
    onError: () => toast.error("Analysis complete, but saving to history failed."),
  });

  const wordCount = useMemo(() => prompt.trim().split(/\s+/).filter(Boolean).length, [prompt]);

  const runAnalysis = () => {
    if (prompt.trim().length < 3) {
      toast.error(t("errWritePrompt"));
      return;
    }
    setRunning(true);
    const current = prompt.trim();
    window.setTimeout(() => {
      const analysis = analyzePrompt(current, model, languageName);
      setResult(analysis);
      setAnalyzedPrompt(current);
      setRunning(false);
      save.mutate({ prompt: current, model, result: analysis });
    }, 450);
  };

  const copyOptimized = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result.optimized);
    setCopied(true);
    toast.success(t("copied"));
    window.setTimeout(() => setCopied(false), 1800);
  };

  const tone = result ? scoreTone(result.score) : "critical";

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <PageHero
        title={t("tagline")}
        subtitle={t("heroSubtitle")}
      />

      <Card className="rise shadow-card hover-lift">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Stethoscope className="size-4 text-primary" />
            {t("yourPrompt")}
          </CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{t("targetModel")}</span>
            <Select value={model} onValueChange={(v) => setModel(v as TargetModel)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TARGET_MODELS.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={t("promptPlaceholder")}
            className="min-h-44 resize-y text-sm leading-relaxed"
          />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              {wordCount} {t("wordsLocal")}
            </p>
            <Button onClick={runAnalysis} disabled={running} size="lg" className="w-full sm:w-auto">
              {running ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> {t("analyzing")}
                </>
              ) : (
                <>
                  <Sparkles className="size-4" /> {t("analyze")}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {result && (
        <>
          <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
            <Card className={`rise hover-lift shadow-card ${SCORE_RING[tone]} border-2`}>
              <CardContent className="flex flex-col items-center gap-3 py-8">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {t("healthScore")}
                </p>
                <p className={`font-display text-7xl font-bold leading-none ${SCORE_CLASS[tone]}`}>
                  {result.score}
                </p>
                <p className="text-xs text-muted-foreground">{t("outOf100")}</p>
                <Badge variant="secondary" className="mt-1">
                  {result.complexity}
                </Badge>
              </CardContent>
            </Card>

            <Card className="rise shadow-card hover-lift">
              <CardHeader>
                <CardTitle className="text-base">{t("xray")}</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {(Object.keys(XRAY_LABELS) as XRayKey[]).map((key) => {
                  const ok = result.xray[key];
                  return (
                    <div
                      key={key}
                      className={`flex items-center gap-3 rounded-xl border p-3 ${
                        ok
                          ? "border-score-great/30 bg-score-great/8"
                          : "border-destructive/30 bg-destructive/8"
                      }`}
                    >
                      <span
                        className={`flex size-7 shrink-0 items-center justify-center rounded-full ${
                          ok
                            ? "bg-score-great/15 text-score-great"
                            : "bg-destructive/15 text-destructive"
                        }`}
                      >
                        {ok ? <Check className="size-4" /> : <X className="size-4" />}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {t(XRAY_I18N[key])}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {ok ? t("present") : t("missing")}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          <Card className="rise shadow-card hover-lift">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TriangleAlert className="size-4 text-destructive" />
                {t("weaknesses")} ({result.weaknesses.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              {result.weaknesses.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  {t("noWeaknesses")}
                </p>
              )}
              {result.weaknesses.map((w) => (
                <div
                  key={w.title}
                  className="rounded-xl border border-destructive/25 border-l-4 border-l-destructive bg-destructive/5 p-4"
                >
                  <p className="text-sm font-semibold text-destructive">{w.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{w.detail}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="rise shadow-card hover-lift">
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-base">{t("comparison")}</CardTitle>
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-score-great/15 text-score-great hover:bg-score-great/15">
                  +{result.improvementPercent}% {t("improvement")}
                </Badge>
                <Badge variant="outline" className={QUALITY_TONE[result.quality]}>
                  {t("projectedQuality")}: {result.quality}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 lg:grid-cols-[1fr_auto_1fr] lg:items-stretch">
                <div className="rounded-xl border border-border bg-muted/40 p-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {t("original")}
                  </p>
                  <pre className="max-h-80 overflow-auto whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">
                    {analyzedPrompt}
                  </pre>
                </div>
                <div className="hidden items-center justify-center lg:flex">
                  <span className="gradient-hero flex size-9 items-center justify-center rounded-full text-brand-foreground shadow-soft">
                    <ArrowRight className="size-4" />
                  </span>
                </div>
                <div className="rounded-xl border-2 border-primary/25 bg-primary/5 p-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-primary">
                    {t("optimized")}
                  </p>
                  <pre className="max-h-80 overflow-auto whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">
                    {result.optimized}
                  </pre>
                </div>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button onClick={copyOptimized} className="sm:w-auto">
                  {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                  {t("copyOptimized")}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => downloadReport(analyzedPrompt, model, result)}
                >
                  <FileDown className="size-4" />
                  {t("downloadPdf")}
                </Button>
              </div>
          </CardContent>
          </Card>

          <AnswerPanel
            optimizedPrompt={result.optimized}
            originalPrompt={analyzedPrompt}
            model={model}
          />


          <Card className="rise shadow-card hover-lift">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Download className="size-4 rotate-180 text-score-great" />
                {t("improvementsApplied")} ({result.improvements.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              {result.improvements.map((i) => (
                <div
                  key={i.title}
                  className="rounded-xl border border-score-great/25 border-l-4 border-l-score-great bg-score-great/5 p-4"
                >
                  <p className="text-sm font-semibold text-score-great">{i.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{i.detail}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
