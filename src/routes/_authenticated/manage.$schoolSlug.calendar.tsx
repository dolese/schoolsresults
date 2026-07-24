import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays } from "lucide-react";
import { getSchoolCalendar } from "@/lib/sims.functions";

export const Route = createFileRoute("/_authenticated/manage/$schoolSlug/calendar")({ component: Page });

function Page() {
  const { schoolSlug } = Route.useParams();
  const fn = useServerFn(getSchoolCalendar);
  const { data, isLoading } = useQuery({ queryKey: ["calendar", schoolSlug], queryFn: () => fn({ data: { slug: schoolSlug } }) });

  return (
    <div className="p-6 md:p-10">
      <div className="mb-6 flex items-center gap-3">
        <CalendarDays className="h-5 w-5 text-muted-foreground" />
        <div>
          <h1 className="font-display text-2xl font-semibold">Academic calendar</h1>
          <p className="text-sm text-muted-foreground">Academic years and exam windows.</p>
        </div>
      </div>
      {isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : (
        <div className="space-y-6">
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Academic years</h2>
            <div className="flex flex-wrap gap-2">
              {(data?.years ?? []).map((y) => (
                <span key={y.id} className={`rounded-full px-3 py-1 text-sm ${y.is_current ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                  {y.year}{y.is_current && " · current"}
                </span>
              ))}
            </div>
          </section>
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Exam windows</h2>
            <div className="overflow-hidden rounded-2xl border border-border/60 bg-card">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                  <tr><th className="p-3">Exam</th><th>Form</th><th>Year</th><th>Opens</th><th>Closes</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {(data?.exams ?? []).map((e) => (
                    <tr key={e.id} className="border-t border-border/50">
                      <td className="p-3 font-medium">{e.name}</td>
                      <td>{(e.forms as { name: string } | null)?.name ?? "-"}</td>
                      <td>{e.year}</td>
                      <td className="text-muted-foreground">{e.opens_at ? new Date(e.opens_at).toLocaleDateString() : "—"}</td>
                      <td className="text-muted-foreground">{e.closes_at ? new Date(e.closes_at).toLocaleDateString() : "—"}</td>
                      <td>{e.published ? <span className="rounded-full bg-green-500/15 px-2 py-0.5 text-xs text-green-600">Published</span> : <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">Draft</span>}</td>
                    </tr>
                  ))}
                  {(data?.exams ?? []).length === 0 && <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">No exams scheduled.</td></tr>}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
