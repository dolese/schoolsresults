import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { UserCheck } from "lucide-react";
import { getSubjectAnalysis } from "@/lib/academic.functions";

export const Route = createFileRoute("/_authenticated/manage/$schoolSlug/reports/teacher")({ component: Page });

function Page() {
  const { schoolSlug } = Route.useParams();
  const fn = useServerFn(getSubjectAnalysis);
  const { data, isLoading } = useQuery({ queryKey: ["teacher-report", schoolSlug], queryFn: () => fn({ data: { slug: schoolSlug } }) });
  const rows = data?.rows ?? [];

  return (
    <div className="p-6 md:p-10">
      <div className="mb-6 flex items-center gap-3">
        <UserCheck className="h-5 w-5 text-muted-foreground" />
        <div>
          <h1 className="font-display text-2xl font-semibold">Teacher performance</h1>
          <p className="text-sm text-muted-foreground">Performance grouped by subject. Assign a class teacher per subject to complete the picture.</p>
        </div>
      </div>
      {isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : (
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-3 text-left">Subject</th>
                <th className="p-3 text-left">Teacher</th>
                <th className="p-3 text-right">Entries</th>
                <th className="p-3 text-right">Average</th>
                <th className="p-3 text-right">Pass rate</th>
                <th className="p-3 text-right">Grade</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-border/50">
                  <td className="p-3 font-medium">{r.name}{r.code ? <span className="ml-2 text-xs text-muted-foreground">{r.code}</span> : null}</td>
                  <td className="p-3 text-muted-foreground">Unassigned</td>
                  <td className="p-3 text-right font-mono">{r.entries}</td>
                  <td className="p-3 text-right font-mono">{r.avg.toFixed(1)}</td>
                  <td className="p-3 text-right font-mono">{r.passRate.toFixed(0)}%</td>
                  <td className="p-3 text-right"><span className="rounded-md bg-muted px-2 py-0.5 font-mono text-xs">{r.grade}</span></td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">No published marks yet.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
