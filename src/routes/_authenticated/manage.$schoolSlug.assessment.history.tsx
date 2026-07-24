import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { History } from "lucide-react";
import { listMarkHistory } from "@/lib/sims.functions";

export const Route = createFileRoute("/_authenticated/manage/$schoolSlug/assessment/history")({ component: Page });

function Page() {
  const { schoolSlug } = Route.useParams();
  const fn = useServerFn(listMarkHistory);
  const { data, isLoading } = useQuery({ queryKey: ["mark-history", schoolSlug], queryFn: () => fn({ data: { slug: schoolSlug, limit: 80 } }) });

  return (
    <div className="p-6 md:p-10">
      <div className="mb-6 flex items-center gap-3">
        <History className="h-5 w-5 text-muted-foreground" />
        <div>
          <h1 className="font-display text-2xl font-semibold">Result history</h1>
          <p className="text-sm text-muted-foreground">Recent mark updates across every exam.</p>
        </div>
      </div>
      {isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : (
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
              <tr><th className="p-3">When</th><th>Student</th><th>Subject</th><th>Exam</th><th className="text-right p-3">Score</th></tr>
            </thead>
            <tbody>
              {(data?.entries ?? []).map((e) => (
                <tr key={e.id} className="border-t border-border/50">
                  <td className="p-3 text-muted-foreground">{new Date(e.updated_at).toLocaleString()}</td>
                  <td className="font-medium">{e.student} <span className="ml-1 text-xs text-muted-foreground">{e.admission}</span></td>
                  <td>{e.subject}</td>
                  <td className="text-muted-foreground">{e.exam}</td>
                  <td className="p-3 text-right font-mono">{e.score ?? "-"}</td>
                </tr>
              ))}
              {(data?.entries ?? []).length === 0 && <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">No mark edits yet.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
