import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, Users, ClipboardList, Send, Megaphone, BookOpen, GraduationCap } from "lucide-react";
import { getAnalytics } from "@/lib/dashboard.functions";

export const Route = createFileRoute("/_authenticated/manage/$schoolSlug/analytics")({
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const { schoolSlug } = Route.useParams();
  const fetchFn = useServerFn(getAnalytics);
  const { data, isLoading } = useQuery({
    queryKey: ["manage-analytics", schoolSlug],
    queryFn: () => fetchFn({ data: { slug: schoolSlug } }),
  });

  const stats = data
    ? [
        { label: "Students", value: data.totals.students, icon: Users },
        { label: "Exams", value: data.totals.exams, icon: ClipboardList },
        { label: "Published exams", value: data.totals.published, icon: Send },
        { label: "Subjects", value: data.totals.subjects, icon: BookOpen },
        { label: "Announcements", value: data.totals.announcements, icon: Megaphone },
        { label: "Total marks entered", value: data.totals.marks, icon: BarChart3 },
      ]
    : [];

  const genderTotal = data ? data.genders.M + data.genders.F + data.genders.U : 0;
  const pct = (n: number) => (genderTotal ? Math.round((n / genderTotal) * 100) : 0);

  return (
    <div className="p-6 md:p-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">Analytics</h1>
          <p className="text-sm text-muted-foreground">Live snapshot of your school's activity.</p>
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {stats.map((s) => (
              <div key={s.label} className="rounded-2xl border border-border/60 bg-card p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wide text-muted-foreground">{s.label}</span>
                  <s.icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="mt-2 font-display text-3xl font-semibold">{s.value}</div>
              </div>
            ))}
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-border/60 bg-card p-5">
              <h2 className="mb-4 font-display text-lg font-semibold">Students by form</h2>
              {data?.forms.length === 0 ? (
                <p className="text-sm text-muted-foreground">No forms configured yet.</p>
              ) : (
                <div className="space-y-3">
                  {data?.forms.map((f) => {
                    const max = Math.max(1, ...(data?.forms ?? []).map((x) => x.count));
                    const pctBar = Math.round((f.count / max) * 100);
                    return (
                      <div key={f.id}>
                        <div className="mb-1 flex items-center justify-between text-sm">
                          <span className="flex items-center gap-2">
                            <GraduationCap className="h-3.5 w-3.5 text-muted-foreground" /> {f.name}
                          </span>
                          <span className="text-muted-foreground">{f.count}</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-muted">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${pctBar}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-border/60 bg-card p-5">
              <h2 className="mb-4 font-display text-lg font-semibold">Gender distribution</h2>
              {genderTotal === 0 ? (
                <p className="text-sm text-muted-foreground">No student records yet.</p>
              ) : (
                <div className="space-y-3">
                  {[
                    { label: "Male", n: data!.genders.M, color: "bg-blue-500" },
                    { label: "Female", n: data!.genders.F, color: "bg-pink-500" },
                    { label: "Unspecified", n: data!.genders.U, color: "bg-muted-foreground/40" },
                  ].map((g) => (
                    <div key={g.label}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span>{g.label}</span>
                        <span className="text-muted-foreground">{g.n} · {pct(g.n)}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div className={`h-full rounded-full ${g.color}`} style={{ width: `${pct(g.n)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}