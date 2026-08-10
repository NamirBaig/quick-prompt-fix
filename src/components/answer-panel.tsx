import { useEffect, useRef, useState } from "react";
import {
  Bot,
  Check,
  Copy,
  FileText,
  Image as ImageIcon,
  Loader2,
  Paperclip,
  Sparkles,
  WifiOff,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n";
import { buildOfflineAnswer, cacheAnswer, getCachedAnswer } from "@/lib/offline-answer";
import type { TargetModel } from "@/lib/prompt-analysis";

type Source = "ai" | "offline" | "cache" | null;

type Attachment = { name: string; mimeType: string; dataUrl: string; size: number };

const MAX_FILES = 3;
const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "text/plain",
  "text/markdown",
  "text/csv",
];

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("read failed"));
    reader.readAsDataURL(file);
  });
}


function renderInline(text: string, keyPrefix: string) {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`|_[^_]+_)/g).map((chunk, i) => {
    const key = `${keyPrefix}-${i}`;
    if (chunk.startsWith("**") && chunk.endsWith("**"))
      return (
        <strong key={key} className="font-semibold text-foreground">
          {chunk.slice(2, -2)}
        </strong>
      );
    if (chunk.startsWith("`") && chunk.endsWith("`"))
      return (
        <code key={key} className="rounded bg-muted px-1 py-0.5 font-mono text-[0.85em]">
          {chunk.slice(1, -1)}
        </code>
      );
    if (chunk.startsWith("_") && chunk.endsWith("_"))
      return (
        <em key={key} className="text-muted-foreground">
          {chunk.slice(1, -1)}
        </em>
      );
    return <span key={key}>{chunk}</span>;
  });
}

function AnswerBody({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <div className="space-y-2 text-sm leading-relaxed">
      {lines.map((line, i) => {
        const key = `l-${i}`;
        const trimmed = line.trim();
        if (!trimmed) return <div key={key} className="h-1" />;
        if (trimmed.startsWith("### "))
          return (
            <p key={key} className="pt-2 text-sm font-semibold text-foreground">
              {renderInline(trimmed.slice(4), key)}
            </p>
          );
        if (trimmed.startsWith("## "))
          return (
            <p key={key} className="pt-2 font-display text-base font-bold text-foreground">
              {renderInline(trimmed.slice(3), key)}
            </p>
          );
        if (trimmed.startsWith("# "))
          return (
            <p key={key} className="font-display text-lg font-bold text-foreground">
              {renderInline(trimmed.slice(2), key)}
            </p>
          );
        if (/^[-*]\s+/.test(trimmed))
          return (
            <p key={key} className="flex gap-2 pl-1 text-muted-foreground">
              <span className="text-primary">•</span>
              <span>{renderInline(trimmed.replace(/^[-*]\s+/, ""), key)}</span>
            </p>
          );
        if (/^\d+\.\s+/.test(trimmed))
          return (
            <p key={key} className="pl-1 text-muted-foreground">
              {renderInline(trimmed, key)}
            </p>
          );
        return (
          <p key={key} className="text-muted-foreground">
            {renderInline(trimmed, key)}
          </p>
        );
      })}
    </div>
  );
}

export function AnswerPanel({
  optimizedPrompt,
  originalPrompt,
  model,
}: {
  optimizedPrompt: string;
  originalPrompt: string;
  model: TargetModel;
}) {
  const { t, languageName } = useI18n();
  const [answer, setAnswer] = useState("");
  const [source, setSource] = useState<Source>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [useOriginal, setUseOriginal] = useState(false);
  const [files, setFiles] = useState<Attachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Reset whenever a new analysis arrives.
  useEffect(() => {
    setAnswer("");
    setSource(null);
    abortRef.current?.abort();
  }, [optimizedPrompt]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const promptToSend = useOriginal ? originalPrompt : optimizedPrompt;

  const onPickFiles = async (list: FileList | null) => {
    if (!list?.length) return;
    const picked: Attachment[] = [];
    for (const file of Array.from(list)) {
      if (files.length + picked.length >= MAX_FILES) {
        toast.error(t("attachTooMany"));
        break;
      }
      if (!ALLOWED.includes(file.type)) {
        toast.error(`${file.name}: ${t("attachUnsupported")}`);
        continue;
      }
      if (file.size > MAX_BYTES) {
        toast.error(`${file.name}: ${t("attachTooLarge")}`);
        continue;
      }
      try {
        picked.push({
          name: file.name,
          mimeType: file.type,
          dataUrl: await readAsDataUrl(file),
          size: file.size,
        });
      } catch {
        toast.error(file.name);
      }
    }
    if (picked.length) setFiles((prev) => [...prev, ...picked].slice(0, MAX_FILES));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const fallback = (reason?: string) => {
    const cached = getCachedAnswer(promptToSend, languageName);
    if (cached) {
      setAnswer(cached);
      setSource("cache");
      return;
    }
    setAnswer(buildOfflineAnswer(promptToSend, model));
    setSource("offline");
    if (reason) toast.message(reason);
  };

  const run = async () => {
    setLoading(true);
    setAnswer("");
    setSource(null);

    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      if (files.length) toast.message(t("attachOfflineNote"));
      fallback();
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: promptToSend,
          model,
          language: languageName,
          attachments: files.map(({ name, mimeType, dataUrl }) => ({ name, mimeType, dataUrl })),
        }),
        signal: controller.signal,
      });


      if (!res.ok || !res.body) {
        const message = await res.text().catch(() => "");
        fallback(message || undefined);
        setLoading(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      setSource("ai");
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setAnswer(acc);
      }
      if (acc.trim()) cacheAnswer(promptToSend, languageName, acc);
      else fallback();
    } catch (error) {
      if ((error as Error).name === "AbortError") {
        setLoading(false);
        return;
      }
      fallback();
    }
    setLoading(false);
  };

  const copy = async () => {
    await navigator.clipboard.writeText(answer);
    setCopied(true);
    toast.success(t("answerCopied"));
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <Card className="shadow-card">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <Bot className="size-4 text-primary" />
            {t("answerTitle")}
          </CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">{t("answerSubtitle")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setUseOriginal((v) => !v)}
            disabled={loading}
          >
            {useOriginal ? t("useOptimizedPrompt") : t("useOriginalPrompt")}
          </Button>
          {loading ? (
            <Button variant="outline" onClick={() => abortRef.current?.abort()}>
              {t("stop")}
            </Button>
          ) : (
            <Button onClick={run}>
              <Sparkles className="size-4" />
              {answer ? t("regenerate") : t("getAnswer")}
            </Button>
          )}
        </div>
      </CardHeader>

      {(loading || answer) && (
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            {source === "offline" && (
              <Badge variant="outline" className="gap-1 text-score-warn">
                <WifiOff className="size-3" /> {t("offlineBadge")}
              </Badge>
            )}
            {source === "cache" && (
              <Badge variant="outline" className="gap-1">
                <WifiOff className="size-3" /> {t("cachedBadge")}
              </Badge>
            )}
            {loading && !answer && (
              <span className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="size-3 animate-spin" /> {t("answering")}
              </span>
            )}
          </div>

          {source === "offline" && (
            <p className="rounded-lg border border-score-warn/30 bg-score-warn/8 p-3 text-xs text-muted-foreground">
              {t("offlineNote")}
            </p>
          )}

          {answer && (
            <>
              <div className="max-h-[32rem] overflow-auto rounded-xl border border-border bg-muted/30 p-4">
                <AnswerBody text={answer} />
              </div>
              <Button variant="outline" size="sm" onClick={copy}>
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                {t("copyAnswer")}
              </Button>
            </>
          )}
        </CardContent>
      )}
    </Card>
  );
}
