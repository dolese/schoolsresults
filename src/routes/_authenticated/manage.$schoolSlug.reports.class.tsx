import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { GraduationCap } from "lucide-react";
import { getClassPerformance } from "@/lib/academic.functions";

export const Route = createFileRoute("/_authenticated/manage/$schoolSlug/reports/class")({ component: Page });

function Page() {
  const { schoolSlug } = Route.useParams();
  const fn = useServerFn(getClassPerformance);
  const { data, isLoading } = useQuery({ queryKey: ["rep-class", schoolSlug], queryFn: () => fn({ data: { slug: schoolSlug } }) });
  const max = Math.max(1, ...(data?.rows ?? []).map((r) => r.avg));

  return (
    <div className="p-6 md:p-10">
      <div className="mb-6 flex items-center gap-3">
        <GraduationCap className="h-5 w-5 text-muted-foreground" />
        <div>
          <h1 className="font-display text-2xl font-semibold">Class performance</h1>
          <p className="text-sm text-muted-foreground">Average marks per form across all published exams.</p>
        </div>
      </div>
      {isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : (
        <div className="rounded-2xl border border-border/60 bg-card p-5">
          <div className="space-y-4">
            {(data?.rows ?? []).map((r) => (
              <div key={r.id}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium">{r.name}</span>
                  <span className="text-muted-foreground">{r.avg.toFixed(1)}% · {r.students} students · {r.entries} entries</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${(r.avg / max) * 100}%` }} />
                </div>
              </div>
            ))}
            {data && data.rows.every((r) => r.entries === 0) && (
              <p className="text-sm text-muted-foreground">Publish exams and enter marks to see class performance.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
