import { createFileRoute } from "@tanstack/react-router";
import { LayoutTemplate, FileText, Award, ScrollText } from "lucide-react";

export const Route = createFileRoute("/_authenticated/manage/$schoolSlug/docs/templates")({ component: Page });

function Page() {
  const templates = [
    { icon: FileText, name: "Standard report card", desc: "NECTA-aligned, includes subject grades, average, division, and position." },
    { icon: Award, name: "Leaving certificate", desc: "Form IV completion certificate with division and school seal placeholder." },
    { icon: ScrollText, name: "Testimonial", desc: "Character reference for continuing students, one page." },
  ];
  return (
    <div className="p-6 md:p-10">
      <div className="mb-6 flex items-center gap-3">
        <LayoutTemplate className="h-5 w-5 text-muted-foreground" />
        <div>
          <h1 className="font-display text-2xl font-semibold">Document templates</h1>
          <p className="text-sm text-muted-foreground">Built-in layouts used by the print center. Custom templates are on the roadmap.</p>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {templates.map((t) => (
          <div key={t.name} className="rounded-2xl border border-border/60 bg-card p-5">
            <div className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary"><t.icon className="h-5 w-5" /></div>
            <h3 className="font-semibold">{t.name}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{t.desc}</p>
            <div className="mt-3 inline-flex rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">Default</div>
          </div>
        ))}
      </div>
    </div>
  );
}
