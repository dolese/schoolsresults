import { Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import { Sparkles, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ComingSoon({
  title,
  description,
  icon: Icon = Sparkles,
  schoolSlug,
  features,
}: {
  title: string;
  description?: string;
  icon?: LucideIcon;
  schoolSlug: string;
  features?: string[];
}) {
  return (
    <div className="p-6 md:p-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">{title}</h1>
          <p className="text-sm text-muted-foreground">
            {description ?? "This module is in active development."}
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link to="/manage/$schoolSlug" params={{ schoolSlug }}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Dashboard
          </Link>
        </Button>
      </div>

      <div className="rounded-2xl border border-dashed border-border/60 bg-card/50 p-10 text-center">
        <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
          <Icon className="h-6 w-6" />
        </div>
        <p className="mx-auto max-w-md text-sm text-muted-foreground">
          We're building this module. Core plumbing is in place; the workflow UI
          will be rolled out in an upcoming release.
        </p>
        {features && features.length > 0 && (
          <ul className="mx-auto mt-6 grid max-w-md gap-2 text-left text-sm">
            {features.map((f) => (
              <li key={f} className="flex items-start gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                <span className="text-muted-foreground">{f}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}