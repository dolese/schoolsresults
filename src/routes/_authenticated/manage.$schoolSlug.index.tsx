import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Users, ClipboardList, CheckCircle2, GraduationCap } from "lucide-react";
import { getManageOverview } from "@/lib/manage.functions";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/manage/$schoolSlug/")({
  head: () => ({ meta: [{ title: "Dashboard — School portal" }] }),
  component: OverviewPage,
});

function OverviewPage() {
  const { schoolSlug } = Route.useParams();
  const fetchOverview = useServerFn(getManageOverview);
  const { data, isLoading } = useQuery({
    queryKey: ["manage-overview", schoolSlug],
    queryFn: () => fetchOverview({ data: { slug: schoolSlug } }),
  });

  if (isLoading) return <div className="p-10 text-muted-foreground">Loading…</div>;
  if (!data) return <div className="p-10 text-muted-foreground">No data.</div>;

  const cards = [
    { label: "Students", v: data.stats.students, icon: Users },
    { label: "Forms", v: data.stats.forms, icon: GraduationCap },
    { label: "Exams", v: data.stats.exams, icon: ClipboardList },
    { label: "Published", v: data.stats.published, icon: CheckCircle2 },
  ];

  return (
    <div className="mx-auto max-w-5xl p-8">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold">{data.school.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {data.school.region ?? "School"} · public portal at{" "}
            <a href={`/${schoolSlug}`} className="text-brand hover:underline" target="_blank" rel="noreferrer">/{schoolSlug}</a>
          </p>
        </div>
        <Button asChild className="bg-brand text-brand-foreground hover:bg-brand/90">
          <Link to="/manage/$schoolSlug/exams" params={{ schoolSlug }}>New exam</Link>
        </Button>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-border/60 bg-card p-5">
            <div className="flex items-center justify-between">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">{c.label}</div>
              <c.icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="mt-3 font-display text-3xl font-bold">{c.v}</div>
          </div>
        ))}
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-border/60 bg-card p-6">
          <h2 className="font-display text-lg font-semibold">Get started</h2>
          <ol className="mt-4 space-y-3 text-sm text-muted-foreground">
            <li>1. Add students under <Link to="/manage/$schoolSlug/students" params={{ schoolSlug }} className="text-brand hover:underline">Students</Link>.</li>
            <li>2. Create an exam and pick subjects.</li>
            <li>3. Enter marks in the grid, then publish so parents can view results.</li>
          </ol>
        </div>
        <div className="rounded-2xl border border-border/60 bg-card p-6">
          <h2 className="font-display text-lg font-semibold">Forms</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {data.forms.map((f) => (
              <li key={f.id} className="flex items-center justify-between rounded-lg bg-secondary px-3 py-2">
                <span className="font-medium">{f.name}</span>
                <span className="text-xs text-muted-foreground">Level {f.level}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}