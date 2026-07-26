import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { History } from "lucide-react";
import { listRecentActivity } from "@/lib/dashboard.functions";
import { listMarkHistory } from "@/lib/sims.functions";

export const Route = createFileRoute("/_authenticated/manage/$schoolSlug/admin/audit")({ component: Page });

function Page() {
  const { schoolSlug } = Route.useParams();
  const marks = useServerFn(listMarkHistory);
  const activity = useServerFn(listRecentActivity);
  const marksQ = useQuery({ queryKey: ["audit-marks", schoolSlug], queryFn: () => marks({ data: { slug: schoolSlug, limit: 100 } }) });
  const actQ = useQuery({ queryKey: ["audit-activity", schoolSlug], queryFn: () => activity({ data: { slug: schoolSlug } }) });

  return (
    <div className="p-6 md:p-10">
      <div className="mb-6 flex items-center gap-3">
        <History className="h-5 w-5 text-muted-foreground" />
        <div>
          <h1 className="font-display text-2xl font-semibold">Audit logs</h1>
          <p className="text-sm text-muted-foreground">Recent activity across marks, exams, students and announcements.</p>
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-border/60 bg-card">
          <header className="border-b border-border/50 p-4 text-sm font-semibold">Marks changes</header>
          <div className="max-h-[520px] overflow-y-auto">
            {(marksQ.data?.entries ?? []).map((e: { id: string; student: string; subject: string; exam: string; updated_at: string; score: number | null }) => (
              <div key={e.id} className="flex items-center justify-between gap-3 border-b border-border/40 p-3 text-sm">
                <div className="min-w-0">
                  <div className="truncate font-medium">{e.student} · <span className="text-muted-foreground">{e.subject}</span></div>
                  <div className="truncate text-xs text-muted-foreground">{e.exam} · {new Date(e.updated_at).toLocaleString()}</div>
                </div>
                <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-xs">{e.score ?? "—"}</span>
              </div>
            ))}
            {(marksQ.data?.entries ?? []).length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">No mark activity yet.</p>}
          </div>
        </section>
        <section className="rounded-2xl border border-border/60 bg-card">
          <header className="border-b border-border/50 p-4 text-sm font-semibold">System activity</header>
          <div className="max-h-[520px] overflow-y-auto">
            {(actQ.data?.items ?? []).map((i: { kind: string; title: string; at: string; id: string }) => (
              <div key={`${i.kind}-${i.id}`} className="flex items-center justify-between gap-3 border-b border-border/40 p-3 text-sm">
                <div className="min-w-0">
                  <div className="truncate font-medium">{i.title}</div>
                  <div className="text-xs text-muted-foreground">{i.kind} · {new Date(i.at).toLocaleString()}</div>
                </div>
              </div>
            ))}
            {(actQ.data?.items ?? []).length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">No recent activity.</p>}
          </div>
        </section>
      </div>
    </div>
  );
}
