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
    <section className="gradient-hero rise hover-lift relative overflow-hidden rounded-4xl px-6 py-12 text-brand-foreground shadow-card sm:px-10 sm:py-16">
      <div className="pointer-events-none absolute -right-16 -top-24 size-72 rounded-full bg-white/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 left-1/3 size-72 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_120%_at_10%_0%,rgba(255,255,255,0.18),transparent_55%)]" />
      <div className="relative max-w-2xl">
        <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium ring-1 ring-white/20 backdrop-blur-md">
          <Stethoscope className="size-3.5" />
          {eyebrow ?? "Prompt Doctor AI"}
        </span>
        <h1 className="mt-5 text-balance text-3xl font-bold sm:text-5xl">{title}</h1>
        <p className="mt-4 max-w-xl text-pretty text-sm/relaxed text-white/85 sm:text-base/relaxed">
          {subtitle}
        </p>
      </div>
    </section>
  );
}
