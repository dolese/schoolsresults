import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { BookOpen } from "lucide-react";
import { getSubjectAnalysis } from "@/lib/academic.functions";

export const Route = createFileRoute("/_authenticated/manage/$schoolSlug/reports/subject")({ component: Page });

function Page() {
  const { schoolSlug } = Route.useParams();
  const fn = useServerFn(getSubjectAnalysis);
  const { data, isLoading } = useQuery({ queryKey: ["rep-subj", schoolSlug], queryFn: () => fn({ data: { slug: schoolSlug } }) });

  return (
    <div className="p-6 md:p-10">
      <div className="mb-6 flex items-center gap-3">
        <BookOpen className="h-5 w-5 text-muted-foreground" />
        <div>
          <h1 className="font-display text-2xl font-semibold">Subject analysis</h1>
          <p className="text-sm text-muted-foreground">Averages, pass rate, and grade per subject.</p>
        </div>
      </div>
      {isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : (
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
              <tr><th className="p-3">Subject</th><th>Code</th><th>Entries</th><th>Avg %</th><th>Pass rate</th><th>Grade</th></tr>
            </thead>
            <tbody>
              {(data?.rows ?? []).map((r) => (
                <tr key={r.id} className="border-t border-border/50">
                  <td className="p-3 font-medium">{r.name}</td>
                  <td className="text-muted-foreground">{r.code ?? "-"}</td>
                  <td>{r.entries}</td>
                  <td>{r.avg.toFixed(1)}</td>
                  <td>{r.passRate.toFixed(0)}%</td>
                  <td><span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-primary/10 px-2 text-xs font-semibold text-primary">{r.grade}</span></td>
                </tr>
              ))}
              {(data?.rows ?? []).length === 0 && <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">No subjects yet.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
