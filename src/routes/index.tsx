import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BookOpenCheck, ShieldCheck, Smartphone, Trophy } from "lucide-react";
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
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main>
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,oklch(0.32_0.13_260/0.18),transparent_60%)]" />
          <div className="mx-auto grid max-w-6xl gap-12 px-4 py-20 md:grid-cols-2 md:py-28">
            <div className="flex flex-col justify-center">
              <span className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-border/60 bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-brand" /> NECTA grading built in
              </span>
              <h1 className="font-display text-5xl font-semibold leading-[1.05] tracking-tight md:text-6xl">
                A results portal <br />
                <span className="text-brand">every school</span> deserves.
              </h1>
              <p className="mt-5 max-w-lg text-lg text-muted-foreground">
                Publish exam results in minutes. Students and parents check grades by
                admission number — instant divisions, NECTA grades, and downloadable report cards.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg" className="bg-brand text-brand-foreground hover:bg-brand/90">
                  <Link to="/signup">
                    Start your school <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link to="/pricing">See pricing</Link>
                </Button>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                Free to get started · No credit card required
              </p>
            </div>
            <div className="relative">
              <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-2xl shadow-primary/5">
                <div className="flex items-center justify-between border-b border-border/60 pb-4">
                  <div>
                    <div className="text-xs uppercase tracking-wider text-muted-foreground">Latest exam</div>
                    <div className="font-display text-lg font-semibold">Mock Exam 2026</div>
                  </div>
                  <span className="rounded-full bg-success/10 px-3 py-1 text-xs font-medium text-success">Published</span>
                </div>
                <div className="grid grid-cols-3 gap-4 py-5 text-center">
                  {[
                    { label: "Students", v: "1,248" },
                    { label: "Division I", v: "186" },
                    { label: "Pass rate", v: "94%" },
                  ].map((s) => (
                    <div key={s.label} className="rounded-xl bg-secondary p-4">
                      <div className="font-display text-2xl font-bold">{s.v}</div>
                      <div className="text-xs text-muted-foreground">{s.label}</div>
                    </div>
                  ))}
                </div>
                <div className="space-y-2 border-t border-border/60 pt-4">
                  {[
                    { n: "ASHA J. MWAKIBETE", g: "Division I", c: "Form IV" },
                    { n: "JUMA H. KIKWETE", g: "Division II", c: "Form IV" },
                    { n: "NEEMA P. SHAYO", g: "Division I", c: "Form III" },
                  ].map((r) => (
                    <div key={r.n} className="flex items-center justify-between rounded-lg px-2 py-2 text-sm hover:bg-accent/40">
                      <span className="font-medium">{r.n}</span>
                      <span className="text-muted-foreground">{r.c} · <span className="text-foreground">{r.g}</span></span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-6 px-4 py-16 md:grid-cols-4">
          {[
            { icon: ShieldCheck, t: "Tenant-safe", d: "Each school has its own private space and roles." },
            { icon: BookOpenCheck, t: "NECTA grading", d: "Auto-compute grades, points, and divisions." },
            { icon: Trophy, t: "Class ranking", d: "See positions per class and per stream." },
            { icon: Smartphone, t: "Mobile-first", d: "Parents check results on any phone." },
          ].map((f) => (
            <div key={f.t} className="rounded-2xl border border-border/60 bg-card p-6">
              <f.icon className="h-6 w-6 text-brand" />
              <h3 className="mt-4 font-semibold">{f.t}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.d}</p>
            </div>
          ))}
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16">
          <div className="rounded-3xl bg-primary p-10 text-center text-primary-foreground md:p-16">
            <h2 className="font-display text-3xl font-semibold md:text-4xl">Bring your school online today</h2>
            <p className="mt-3 text-primary-foreground/80">Set up your portal in minutes. No technical skills required.</p>
            <Button asChild size="lg" className="mt-6 bg-brand text-brand-foreground hover:bg-brand/90">
              <Link to="/signup">Create my school portal</Link>
            </Button>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
