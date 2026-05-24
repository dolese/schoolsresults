import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BookOpenCheck,
  ShieldCheck,
  Smartphone,
  Trophy,
  Sparkles,
} from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/site/SiteHeader";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SchoolsResultsPortal — NECTA results portal for every school" },
      {
        name: "description",
        content:
          "A modern, multi-school results portal. Publish exam results, manage classes, and let students and parents check NECTA grades and divisions instantly.",
      },
      { property: "og:title", content: "SchoolsResultsPortal" },
      {
        property: "og:description",
        content: "Modern NECTA results portal for Tanzanian secondary schools.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main className="relative">
        {/* Ambient background wash */}
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[720px] bg-[radial-gradient(ellipse_at_top,color-mix(in_oklab,var(--color-accent)_22%,transparent),transparent_60%)]" />

        <div className="mx-auto max-w-6xl px-4 py-14 md:py-24">
          {/* HERO */}
          <header className="mx-auto max-w-3xl text-center">
            <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-accent/15 bg-secondary px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-secondary-foreground">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand" />
              NECTA grading built in
            </span>
            <h1 className="font-display text-4xl font-bold leading-[1.05] tracking-tight md:text-6xl">
              A results portal{" "}
              <span className="bg-gradient-to-r from-brand to-amber-600 bg-clip-text italic text-transparent">
                every school
              </span>{" "}
              deserves.
            </h1>
            <p className="mx-auto mt-7 max-w-xl text-base leading-relaxed text-secondary-foreground/80 md:text-lg">
              The modern NECTA results portal for Tanzanian secondary schools. Publish
              instant divisions, automated rankings, and downloadable report cards in
              minutes.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="h-12 rounded-xl bg-brand px-7 text-base font-bold text-brand-foreground shadow-[var(--shadow-amber)] hover:bg-brand/90"
              >
                <Link to="/signup">
                  Start your school <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 rounded-xl border-2 border-border bg-card px-7 text-base font-semibold hover:border-accent"
              >
                <Link to="/pricing">See pricing</Link>
              </Button>
            </div>
            <p className="mt-5 text-xs font-medium text-muted-foreground">
              Free to get started · No credit card required
            </p>
          </header>

          {/* BENTO GRID */}
          <div className="mt-20 grid grid-cols-1 gap-5 md:grid-cols-12">
            {/* Live preview tile — glassmorphic floating report card */}
            <div className="group relative overflow-hidden rounded-3xl border border-border bg-card p-7 shadow-[var(--shadow-soft)] transition-shadow hover:shadow-xl md:col-span-8 md:p-8">
              <div className="relative z-10">
                <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-accent">
                  Real-time analysis
                </span>
                <h3 className="mt-2 font-display text-2xl font-bold">
                  Sample report card
                </h3>

                <div className="glass-panel mt-6 rounded-2xl p-5 md:p-6">
                  <div className="mb-5 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-tight text-secondary-foreground/60">
                        Latest exam
                      </p>
                      <p className="font-bold text-foreground">Mock Exam 2026</p>
                    </div>
                    <span className="rounded-full bg-success/15 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-success">
                      Published
                    </span>
                  </div>

                  <div className="mb-5 grid grid-cols-3 gap-3">
                    {[
                      { v: "1,248", l: "Students" },
                      { v: "186", l: "Division I" },
                      { v: "94%", l: "Pass rate" },
                    ].map((s) => (
                      <div
                        key={s.l}
                        className="rounded-xl border border-border/70 bg-card/80 p-3 text-center backdrop-blur md:p-4"
                      >
                        <p className="font-display text-xl font-bold md:text-2xl">{s.v}</p>
                        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                          {s.l}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-1">
                    {[
                      { n: "ASHA J. MWAKIBETE", c: "Form IV", g: "Division I" },
                      { n: "JUMA H. KIKWETE", c: "Form IV", g: "Division II" },
                      { n: "NEEMA P. SHAYO", c: "Form III", g: "Division I" },
                    ].map((r) => (
                      <div
                        key={r.n}
                        className="flex items-center justify-between border-b border-border/60 py-2 text-sm last:border-0"
                      >
                        <span className="font-semibold">{r.n}</span>
                        <span className="text-xs text-accent">
                          {r.c} · <span className="font-bold text-foreground">{r.g}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="pointer-events-none absolute -right-24 -bottom-24 h-72 w-72 rounded-full bg-accent/10 blur-3xl" />
              <div className="pointer-events-none absolute -left-16 -top-16 h-56 w-56 rounded-full bg-brand/10 blur-3xl" />
            </div>

            {/* NECTA grading dark tile */}
            <div className="rounded-3xl border border-white/10 bg-primary p-7 text-primary-foreground shadow-lg md:col-span-4 md:p-8">
              <div className="mb-6 grid h-12 w-12 place-items-center rounded-2xl bg-white/10">
                <BookOpenCheck className="h-6 w-6 text-brand" />
              </div>
              <h3 className="mb-3 font-display text-xl font-bold">
                Auto-NECTA grading
              </h3>
              <p className="mb-6 text-sm leading-relaxed text-primary-foreground/70">
                Computes grades (A–F), points, and divisions automatically using official
                NECTA standards for O-Level and A-Level.
              </p>
              <div className="space-y-2">
                <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                  <div className="h-full w-[92%] rounded-full bg-brand" />
                </div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">
                  Logic accuracy · 100% verified
                </p>
              </div>
            </div>

            {/* Mobile / Parent access */}
            <div className="group rounded-3xl border border-accent/15 bg-secondary p-7 transition-colors hover:border-accent/40 md:col-span-4 md:p-8">
              <div className="mb-6 grid h-12 w-12 place-items-center rounded-2xl bg-accent text-accent-foreground shadow-md">
                <Smartphone className="h-6 w-6" />
              </div>
              <h3 className="mb-3 font-display text-xl font-bold">Parent access</h3>
              <p className="text-sm leading-relaxed text-secondary-foreground/75">
                A mobile-first interface so parents can look up results by admission
                number from any phone — no app, no login friction.
              </p>
            </div>

            {/* Ranking tile */}
            <div className="rounded-3xl border border-border bg-card p-7 shadow-sm md:col-span-4 md:p-8">
              <div className="mb-6 grid h-12 w-12 place-items-center rounded-2xl bg-amber-50">
                <Trophy className="h-6 w-6 text-amber-600" />
              </div>
              <h3 className="mb-3 font-display text-xl font-bold">Stream ranking</h3>
              <p className="text-sm leading-relaxed text-secondary-foreground/75">
                Instant positions per class, per stream, and across an entire grade
                level — recalculated the moment marks are saved.
              </p>
            </div>

            {/* Tenant-safe dark tile */}
            <div className="rounded-3xl border border-white/5 bg-[oklch(0.27_0.06_260)] p-7 text-white md:col-span-4 md:p-8">
              <div className="mb-6 grid h-12 w-12 place-items-center rounded-2xl bg-white/10">
                <ShieldCheck className="h-6 w-6 text-white" />
              </div>
              <h3 className="mb-3 font-display text-xl font-bold">Tenant-safe</h3>
              <p className="text-sm leading-relaxed text-white/70">
                Strict data isolation for multi-school environments. Every institution
                manages its own private, role-gated vault.
              </p>
            </div>
          </div>

          {/* Trust strip */}
          <div className="mt-12 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-border/60 md:grid-cols-4">
            {[
              { v: "250+", l: "Schools onboarded" },
              { v: "150k+", l: "Results processed" },
              { v: "26", l: "Regions covered" },
              { v: "99.9%", l: "Portal uptime" },
            ].map((s) => (
              <div key={s.l} className="bg-card p-5 text-center md:p-6">
                <p className="font-display text-2xl font-bold text-foreground md:text-3xl">
                  {s.v}
                </p>
                <p className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {s.l}
                </p>
              </div>
            ))}
          </div>

          {/* CTA band */}
          <section className="relative mt-20 overflow-hidden rounded-[2.5rem] p-10 text-center text-primary-foreground md:p-16"
            style={{ background: "var(--gradient-cta)" }}>
            <div className="relative z-10">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/90 backdrop-blur">
                <Sparkles className="h-3.5 w-3.5 text-brand" /> Built for Tanzanian schools
              </div>
              <h2 className="mx-auto max-w-2xl font-display text-3xl font-bold md:text-5xl">
                Bring your school online today
              </h2>
              <p className="mx-auto mt-5 max-w-xl text-base text-white/75 md:text-lg">
                Set up your portal in minutes. No technical skills required. Trusted by
                250+ secondary schools across the country.
              </p>
              <Button
                asChild
                size="lg"
                className="mt-8 h-14 rounded-2xl bg-brand px-10 text-base font-bold text-brand-foreground shadow-[var(--shadow-amber)] hover:bg-brand/90"
              >
                <Link to="/signup">Create my school portal</Link>
              </Button>
            </div>
            <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-16 -left-12 h-56 w-56 rounded-full bg-brand/20 blur-3xl" />
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
