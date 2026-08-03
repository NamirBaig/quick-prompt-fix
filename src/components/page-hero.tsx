import { Stethoscope } from "lucide-react";

export function PageHero({
  title,
  subtitle,
  eyebrow,
}: {
  title: string;
  subtitle: string;
  eyebrow?: string;
}) {
  return (
    <section className="gradient-hero relative overflow-hidden rounded-3xl px-6 py-10 text-brand-foreground shadow-card sm:px-10 sm:py-14">
      <div className="pointer-events-none absolute -right-16 -top-20 size-64 rounded-full bg-white/10 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-24 left-1/3 size-64 rounded-full bg-white/10 blur-3xl" />
      <div className="relative max-w-2xl">
        <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
          <Stethoscope className="size-3.5" />
          {eyebrow ?? "Prompt Doctor AI"}
        </span>
        <h1 className="mt-4 text-3xl font-bold sm:text-4xl">{title}</h1>
        <p className="mt-3 text-sm/relaxed text-white/85 sm:text-base/relaxed">{subtitle}</p>
      </div>
    </section>
  );
}
