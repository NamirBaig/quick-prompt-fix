import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Stethoscope } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { lovable } from "@/integrations/lovable/index";
import { supabase } from "@/integrations/supabase/client";

type Search = { redirect?: string | undefined };

function safePath(value: unknown): string {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//")
    ? value
    : "/";
}

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    redirect: typeof search["redirect"] === "string" ? (search["redirect"] as string) : undefined,
  }),

  head: () => ({
    meta: [
      { title: "Sign in or create an account — Prompt Doctor AI" },
      {
        name: "description",
        content:
          "Create a free Prompt Doctor AI account to save your analyzed prompts, health scores and optimized rewrites across every device.",
      },
      { property: "og:title", content: "Sign in — Prompt Doctor AI" },
      {
        property: "og:description",
        content: "Sign in to keep your prompt history, scores and optimized rewrites in one place.",
      },
      { property: "og:url", content: "https://quick-prompt-fix.lovable.app/auth" },
      { name: "twitter:title", content: "Sign in — Prompt Doctor AI" },
      {
        name: "twitter:description",
        content: "Sign in to keep your prompt history, scores and optimized rewrites in one place.",
      },
    ],
    links: [{ rel: "canonical", href: "https://quick-prompt-fix.lovable.app/auth" }],
  }),
  component: AuthPage,
});

function AuthPage() {
  const search = useSearch({ from: "/auth" });
  const navigate = useNavigate();
  const target = safePath(search.redirect);

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [sentEmail, setSentEmail] = useState(false);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active && data.session) navigate({ to: target, replace: true });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) navigate({ to: target, replace: true });
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [navigate, target]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { display_name: name.trim() || email.split("@")[0] },
          },
        });
        if (error) throw error;
        if (!data.session) {
          setSentEmail(true);
          toast.success("Check your email to confirm your account.");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    setBusy(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        toast.error("Google sign-in failed. Please try again.");
        return;
      }
      if (result.redirected) return;
      navigate({ to: target, replace: true });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center gap-6 py-10">
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="gradient-hero flex size-12 items-center justify-center rounded-2xl text-brand-foreground shadow-soft">
          <Stethoscope className="size-6" />
        </span>
        <h1 className="font-display text-2xl font-bold">
          {mode === "signin" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="text-sm text-muted-foreground">
          Sign in to keep your prompt history, scores and optimized rewrites saved to your account.
        </p>
      </div>

      <Card className="w-full shadow-soft">
        <CardContent className="pt-6">
          {sentEmail ? (
            <div className="space-y-3 text-center">
              <p className="text-sm font-medium">Confirm your email</p>
              <p className="text-sm text-muted-foreground">
                We sent a confirmation link to {email}. Click it to activate your account, then come
                back and sign in.
              </p>
              <Button variant="outline" onClick={() => setSentEmail(false)} className="w-full">
                Back to sign in
              </Button>
            </div>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                className="w-full press"
                onClick={handleGoogle}
                disabled={busy}
              >
                Continue with Google
              </Button>

              <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-wide text-muted-foreground">
                <span className="h-px flex-1 bg-border" />
                or
                <span className="h-px flex-1 bg-border" />
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === "signup" && (
                  <div className="space-y-2">
                    <Label htmlFor="name">Display name</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      maxLength={60}
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    maxLength={255}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    minLength={8}
                    autoComplete={mode === "signin" ? "current-password" : "new-password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    maxLength={72}
                  />
                </div>
                <Button type="submit" className="w-full press" disabled={busy}>
                  {busy && <Loader2 className="size-4 animate-spin" />}
                  {mode === "signin" ? "Sign in" : "Create account"}
                </Button>
              </form>

              <p className="mt-4 text-center text-sm text-muted-foreground">
                {mode === "signin" ? "New here? " : "Already have an account? "}
                <button
                  type="button"
                  className="font-medium text-primary hover:underline"
                  onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
                >
                  {mode === "signin" ? "Create an account" : "Sign in"}
                </button>
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
