import { createFileRoute, Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/site/SiteHeader";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — SchoolsResultsPortal" },
      { name: "description", content: "Simple plans for schools of every size." },
    ],
  }),
  component: Pricing,
});

const tiers = [
  { name: "Free", price: "TZS 0", desc: "Up to 100 students", feats: ["Public results portal", "NECTA grading", "1 admin user"] },
  { name: "School", price: "TZS 80,000/mo", desc: "Up to 1,000 students", feats: ["Unlimited exams", "Up to 20 staff", "PDF report cards", "Announcements"], featured: true },
  { name: "District", price: "Contact us", desc: "Multiple schools", feats: ["Centralized analytics", "Custom branding", "Priority support"] },
];

function Pricing() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-20">
        <h1 className="font-display text-center text-4xl font-semibold md:text-5xl">Plans for every school</h1>
        <p className="mt-3 text-center text-muted-foreground">Start free. Upgrade when you outgrow it.</p>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {tiers.map((t) => (
            <div key={t.name} className={`flex flex-col rounded-2xl border p-8 ${t.featured ? "border-brand bg-card shadow-xl" : "border-border/60 bg-card"}`}>
              {t.featured && <span className="mb-2 w-fit rounded-full bg-brand/15 px-3 py-1 text-xs font-medium text-brand">Most popular</span>}
              <h3 className="font-display text-xl font-semibold">{t.name}</h3>
              <div className="mt-2 font-display text-3xl font-bold">{t.price}</div>
              <p className="text-sm text-muted-foreground">{t.desc}</p>
              <ul className="mt-6 flex-1 space-y-2 text-sm">
                {t.feats.map((f) => (
                  <li key={f} className="flex items-center gap-2"><Check className="h-4 w-4 text-success" /> {f}</li>
                ))}
              </ul>
              <Button asChild className={`mt-6 ${t.featured ? "bg-brand text-brand-foreground hover:bg-brand/90" : ""}`} variant={t.featured ? "default" : "outline"}>
                <Link to="/signup">Get started</Link>
              </Button>
            </div>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
