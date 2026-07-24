import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import { getVerificationOverview } from "@/lib/sims.functions";

export const Route = createFileRoute("/_authenticated/manage/$schoolSlug/assessment/verify")({ component: Page });

function Page() {
  const { schoolSlug } = Route.useParams();
  const fn = useServerFn(getVerificationOverview);
  const { data, isLoading } = useQuery({ queryKey: ["verify", schoolSlug], queryFn: () => fn({ data: { slug: schoolSlug } }) });

  return (
    <div className="p-6 md:p-10">
      <div className="mb-6 flex items-center gap-3">
        <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
        <div>
          <h1 className="font-display text-2xl font-semibold">Verify results</h1>
          <p className="text-sm text-muted-foreground">Check completeness before publishing to the public portal.</p>
        </div>
      </div>
      {isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : (
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
              <tr><th className="p-3">Exam</th><th>Form</th><th>Year</th><th>Filled</th><th>Missing</th><th>Completion</th><th>Status</th><th className="p-3"></th></tr>
            </thead>
            <tbody>
              {(data?.rows ?? []).map((r) => (
                <tr key={r.id} className="border-t border-border/50">
                  <td className="p-3 font-medium">{r.name}</td>
                  <td>{r.form}</td>
                  <td>{r.year}</td>
                  <td>{r.filled} / {r.expected}</td>
                  <td className={r.missing > 0 ? "text-amber-600" : "text-muted-foreground"}>
                    {r.missing > 0 && <AlertTriangle className="mr-1 inline h-3 w-3" />}
                    {r.missing}
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary" style={{ width: `${r.completion}%` }} /></div>
                      <span className="text-xs text-muted-foreground">{r.completion}%</span>
                    </div>
                  </td>
                  <td>{r.published ? <span className="rounded-full bg-green-500/15 px-2 py-0.5 text-xs font-medium text-green-600">Published</span> : <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">Draft</span>}</td>
                  <td className="p-3 text-right">
                    <Link to="/manage/$schoolSlug/exams/$examId" params={{ schoolSlug, examId: r.id }} className="text-primary hover:underline">Open</Link>
                  </td>
                </tr>
              ))}
              {(data?.rows ?? []).length === 0 && <tr><td colSpan={8} className="p-6 text-center text-muted-foreground">No exams yet.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
