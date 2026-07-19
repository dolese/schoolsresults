import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Building2,
  GraduationCap,
  Upload,
  Printer,
  BarChart3,
  Users,
  ShieldCheck,
  Lock,
  KeyRound,
  Check,
} from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/site/SiteHeader";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SchoolsResultsPortal — Exam results management, done properly" },
      {
        name: "description",
        content:
          "A modern multi-school results portal. Turn marks into ranked result sheets, NECTA divisions and printable report cards across every school on one secure platform.",
      },
      { property: "og:title", content: "SchoolsResultsPortal" },
      {
        property: "og:description",
        content:
          "Exam results management for Tanzanian secondary schools — NECTA grading, divisions, and printable report cards on one secure, multi-tenant platform.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <Pricing />
        <Security />
        <FinalCta />
      </main>
      <SiteFooter />
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[720px] bg-[radial-gradient(ellipse_at_top,color-mix(in_oklab,var(--color-success)_18%,transparent),transparent_65%)]" />
      <div className="mx-auto max-w-5xl px-4 py-20 text-center md:py-28">
        <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/70 px-4 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur">
          <span className="h-1.5 w-1.5 rounded-full bg-success" />
          Built for Tanzanian secondary schools
        </span>
        <h1 className="mt-8 font-display text-4xl leading-[1.05] tracking-tight text-primary sm:text-5xl md:text-6xl lg:text-7xl">
          Exam results management,{" "}
          <em className="font-normal italic text-primary/90">done properly.</em>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
          SchoolsResultsPortal turns marks into ranked result sheets, divisions
          and printable report cards across every school on one secure,
          multi-tenant platform.
        </p>
        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild size="lg" className="rounded-full bg-success px-7 text-success-foreground hover:bg-success/90">
            <Link to="/login">
              Sign in to your school
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="rounded-full border-border/80 bg-background px-7">
            <a href="#pricing">Pricing</a>
          </Button>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          No spreadsheets. No manual ranking. NECTA-style grading out of the box.
        </p>

        <HeroPreview />
      </div>
    </section>
  );
}

function HeroPreview() {
  const rows = [
    { cno: "P0101/0001", name: "Amina Hassan", div: "I", pts: 8, avg: 82.4 },
    { cno: "P0101/0002", name: "Baraka Mushi", div: "I", pts: 9, avg: 79.1 },
    { cno: "P0101/0003", name: "Chausiku Juma", div: "II", pts: 14, avg: 71.6 },
    { cno: "P0101/0004", name: "Daudi Mwakalinga", div: "II", pts: 15, avg: 68.9 },
    { cno: "P0101/0005", name: "Elizabeth Nyerere", div: "III", pts: 21, avg: 61.2 },
  ];
  return (
    <div className="mx-auto mt-14 max-w-4xl rounded-3xl border border-border/70 bg-card/80 p-4 shadow-[0_30px_80px_-40px_rgba(15,27,61,0.35)] backdrop-blur md:p-6">
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-destructive/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-brand/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-success/80" />
          <span className="ml-3 font-mono text-xs text-muted-foreground">
            /bonde-secondary/results
          </span>
        </div>
        <span className="hidden text-xs text-muted-foreground sm:inline">
          Form 4 · Mock Exam · Published
        </span>
      </div>
      <div className="mt-4 overflow-hidden rounded-xl border border-border/60">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-3 py-2">CNO</th>
              <th className="px-3 py-2">Student</th>
              <th className="px-3 py-2">Division</th>
              <th className="px-3 py-2">Points</th>
              <th className="px-3 py-2 text-right">Avg</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {rows.map((r) => (
              <tr key={r.cno} className="odd:bg-background even:bg-muted/20">
                <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{r.cno}</td>
                <td className="px-3 py-2 font-medium">{r.name}</td>
                <td className="px-3 py-2">
                  <span className="inline-flex rounded-full bg-success/15 px-2 py-0.5 text-xs font-semibold text-success">
                    Div {r.div}
                  </span>
                </td>
                <td className="px-3 py-2 tabular-nums">{r.pts}</td>
                <td className="px-3 py-2 text-right tabular-nums font-semibold">{r.avg}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SectionLabel({ label, title, subtitle }: { label: string; title: React.ReactNode; subtitle?: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-success">{label}</span>
      <h2 className="mt-3 font-display text-3xl leading-tight text-primary sm:text-4xl md:text-5xl">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-4 text-base text-muted-foreground md:text-lg">{subtitle}</p>
      )}
    </div>
  );
}

function Features() {
  const items = [
    { icon: Building2, title: "Multi-school platform", body: "One secure portal for many schools. Row-level tenant isolation keeps every school's data completely separate." },
    { icon: GraduationCap, title: "NECTA grading and divisions", body: "A–F grading, points, and Division I–0 are computed automatically from best-seven subjects the way Tanzanian schools expect." },
    { icon: Upload, title: "Roster import and CNO", body: "Import students from CSV or Excel with validation, then auto-assign candidate numbers with female-first alphabetical ordering." },
    { icon: Printer, title: "Printable report cards", body: "Professional, print-ready student report cards and class result sheets generated directly from real marks." },
    { icon: BarChart3, title: "Live analytics", body: "Division distribution, subject performance, pass rates and top performers update as soon as marks are entered." },
    { icon: Users, title: "Role-based access", body: "School admins, academic staff, teachers, and guardians only see what they need to do their job." },
  ];
  return (
    <section id="features" className="border-t border-border/60 bg-muted/30 py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4">
        <SectionLabel
          label="Features"
          title={<>Everything a results office <em className="italic font-normal">needs</em></>}
          subtitle="From onboarding a school to handing a parent a printed report card, the whole workflow stays in one place."
        />
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((it) => (
            <div key={it.title} className="group rounded-2xl border border-border/60 bg-card p-6 transition hover:border-primary/30 hover:shadow-lg">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
                <it.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-5 font-display text-lg font-semibold text-primary">{it.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{it.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { title: "Onboard the school", body: "Create the school, admin account, academic year, forms, streams and subjects." },
    { title: "Build the roster", body: "Import students in bulk or add them manually, then let the system assign CNOs automatically." },
    { title: "Enter marks", body: "Secure, role-based marks entry per exam with no cross-exam leakage." },
    { title: "Generate results", body: "Publish ranked result sheets, divisions and printable report cards instantly." },
  ];
  return (
    <section id="how" className="border-t border-border/60 py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4">
        <SectionLabel
          label="How it works"
          title={<>From roster to report card in <em className="italic font-normal">four steps</em></>}
          subtitle="A workflow that mirrors how schools already run their exams, just faster and error-free."
        />
        <ol className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <li key={s.title} className="relative rounded-2xl border border-border/60 bg-card p-6">
              <span className="font-display text-5xl font-semibold leading-none text-success/30">
                {i + 1}
              </span>
              <h3 className="mt-5 font-display text-lg font-semibold text-primary">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Pricing() {
  const plans = [
    {
      name: "Starter",
      tag: "Best for single-campus setup",
      price: "$9.9",
      unit: "per school / month · billed annually",
      features: [
        "Up to 600 students",
        "Marks entry, results sheets, report cards",
        "One admin account + teacher access",
        "Email support",
      ],
      cta: "Choose plan",
      featured: false,
    },
    {
      name: "Standard",
      tag: "Most schools will start here",
      price: "$19.9",
      unit: "per school / month · billed annually",
      features: [
        "Up to 2,000 students",
        "SMS-ready workflows and analytics",
        "Multiple staff roles and class workflows",
        "Priority support",
      ],
      cta: "Choose plan",
      featured: true,
    },
    {
      name: "Enterprise",
      tag: "For groups or district rollouts",
      price: "Let's talk",
      unit: "custom onboarding",
      features: [
        "Multi-school rollout support",
        "Custom branding and onboarding",
        "Data migration and training",
        "Dedicated support channel",
      ],
      cta: "Contact sales",
      featured: false,
    },
  ];
  return (
    <section id="pricing" className="border-t border-border/60 bg-muted/30 py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4">
        <SectionLabel
          label="Pricing"
          title={<>Simple pricing for <em className="italic font-normal">growing schools</em></>}
          subtitle="Start with one school, scale to multiple campuses, and keep support predictable as your exams workflow grows."
        />
        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {plans.map((p) => (
            <div
              key={p.name}
              className={
                "relative flex flex-col rounded-2xl border p-7 " +
                (p.featured
                  ? "border-primary bg-primary text-primary-foreground shadow-xl"
                  : "border-border/60 bg-card")
              }
            >
              <span
                className={
                  "text-xs " +
                  (p.featured ? "text-primary-foreground/70" : "text-muted-foreground")
                }
              >
                {p.tag}
              </span>
              <h3 className="mt-2 font-display text-2xl font-semibold">{p.name}</h3>
              <div className="mt-5 flex items-baseline gap-1">
                <span className="font-display text-4xl font-semibold">{p.price}</span>
              </div>
              <p className={"mt-1 text-xs " + (p.featured ? "text-primary-foreground/70" : "text-muted-foreground")}>
                {p.unit}
              </p>
              <ul className="mt-6 space-y-3 text-sm">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className={"mt-0.5 h-4 w-4 shrink-0 " + (p.featured ? "text-success" : "text-success")} />
                    <span className={p.featured ? "text-primary-foreground/90" : "text-foreground/80"}>{f}</span>
                  </li>
                ))}
              </ul>
              <Button
                asChild
                className={
                  "mt-8 rounded-full " +
                  (p.featured
                    ? "bg-success text-success-foreground hover:bg-success/90"
                    : "bg-primary text-primary-foreground hover:bg-primary/90")
                }
              >
                <Link to="/signup">{p.cta}</Link>
              </Button>
            </div>
          ))}
        </div>
        <p className="mt-8 text-center text-xs text-muted-foreground">
          All plans include tenant isolation, secure login, and bilingual public access.
        </p>
      </div>
    </section>
  );
}

function Security() {
  const items = [
    { icon: Lock, title: "Tenant isolation", body: "Database-level protection ensures one school can never read another school's students or marks." },
    { icon: KeyRound, title: "Hardened auth", body: "Rate-limited sign-in, hashed passwords, session expiry and mandatory first-login password reset." },
    { icon: ShieldCheck, title: "Least privilege", body: "Every role — admin, academic, teacher, guardian — is scoped to only what it needs." },
  ];
  return (
    <section id="security" className="border-t border-border/60 py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4">
        <SectionLabel
          label="Security"
          title={<>Secure by <em className="italic font-normal">design</em></>}
          subtitle="Each school's data is isolated at the database level. Staff sign in with rate-limited logins, hashed passwords, and forced password changes on first use."
        />
        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {items.map((it) => (
            <div key={it.title} className="rounded-2xl border border-border/60 bg-card p-6">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-success/15 text-success">
                <it.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-5 font-display text-lg font-semibold text-primary">{it.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{it.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="border-t border-border/60 bg-primary text-primary-foreground">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 px-4 py-20 text-center md:py-24">
        <h2 className="font-display text-3xl leading-tight sm:text-4xl md:text-5xl">
          Ready to run results <em className="italic font-normal">professionally?</em>
        </h2>
        <p className="max-w-2xl text-primary-foreground/80">
          Launch a school tenant, import the roster, enter marks and generate report cards from one clean system.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg" className="rounded-full bg-success px-7 text-success-foreground hover:bg-success/90">
            <Link to="/signup">
              Get started
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="rounded-full border-primary-foreground/30 bg-transparent px-7 text-primary-foreground hover:bg-primary-foreground/10">
            <Link to="/login">Sign in</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
