import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Building2 } from "lucide-react";
import { getSchoolPerformance } from "@/lib/academic.functions";

export const Route = createFileRoute("/_authenticated/manage/reports/school")({ component: Page });

function Page() {
  const { schoolSlug } = Route.useParams();
  const fn = useServerFn(getSchoolPerformance);
  const { data, isLoading } = useQuery({ queryKey: ["rep-school", schoolSlug], queryFn: () => fn({ data: { slug: schoolSlug } }) });
  const totalGrades = data ? Object.values(data.gradeCounts).reduce((a, b) => a + b, 0) : 0;

  return (
    <div className="p-6 md:p-10">
      <div className="mb-6 flex items-center gap-3">
        <Building2 className="h-5 w-5 text-muted-foreground" />
        <div>
          <h1 className="font-display text-2xl font-semibold">School performance</h1>
          <p className="text-sm text-muted-foreground">Overall snapshot across published exams.</p>
        </div>
      </div>
      {isLoading || !data ? <p className="text-sm text-muted-foreground">Loading…</p> : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Overall average", value: `${data.overallAvg.toFixed(1)}%` },
              { label: "Pass rate", value: `${data.passRate.toFixed(0)}%` },
              { label: "Published exams", value: data.publishedExams },
              { label: "Students assessed", value: data.studentsAssessed },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl border border-border/60 bg-card p-5">
                <div className="text-xs uppercase text-muted-foreground">{s.label}</div>
                <div className="mt-1 font-display text-3xl font-semibold">{s.value}</div>
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-2xl border border-border/60 bg-card p-5">
            <h2 className="mb-3 font-display text-lg font-semibold">Grade distribution</h2>
            {totalGrades === 0 ? <p className="text-sm text-muted-foreground">No marks yet.</p> : (
              <div className="space-y-3">
                {Object.entries(data.gradeCounts).map(([g, n]) => {
                  const pct = totalGrades ? (n / totalGrades) * 100 : 0;
                  return (
                    <div key={g}>
                      <div className="mb-1 flex justify-between text-sm"><span className="font-medium">{g}</span><span className="text-muted-foreground">{n} · {pct.toFixed(0)}%</span></div>
                      <div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} /></div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
