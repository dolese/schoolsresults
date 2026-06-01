import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { ArrowLeft, Printer } from "lucide-react";
import { getExamAnalytics } from "@/lib/manage.functions";
import { gradeFor, computeDivision } from "@/lib/grading";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute(
  "/_authenticated/manage/$schoolSlug/exams/$examId/reports",
)({
  head: () => ({ meta: [{ title: "Bulk report cards — Dashboard" }] }),
  component: ReportsPage,
});

function ReportsPage() {
  const { schoolSlug, examId } = Route.useParams();
  const fetchFn = useServerFn(getExamAnalytics);
  const q = useQuery({
    queryKey: ["exam-analytics", schoolSlug, examId],
    queryFn: () => fetchFn({ data: { slug: schoolSlug, examId } }),
  });

  const cards = useMemo(() => {
    if (!q.data) return [];
    const { students, subjects, marks, school, exam } = q.data;
    const byStudent = new Map<string, Map<string, number>>();
    for (const m of marks) {
      if (m.score == null) continue;
      if (!byStudent.has(m.student_id)) byStudent.set(m.student_id, new Map());
      byStudent.get(m.student_id)!.set(m.subject_id, Number(m.score));
    }

    const rows = students.map((s) => {
      const sm = byStudent.get(s.id) ?? new Map<string, number>();
      const entries = subjects
        .map((sub) => ({ sub, score: sm.get(sub.id) }))
        .filter((e) => typeof e.score === "number") as {
        sub: (typeof subjects)[number];
        score: number;
      }[];
      const scores = entries.map((e) => e.score);
      const total = scores.reduce((a, b) => a + b, 0);
      const avg = scores.length ? total / scores.length : 0;
      const div = scores.length >= 4 ? computeDivision(scores) : null;
      return { student: s, entries, total, avg, division: div };
    });

    const ranked = [...rows]
      .filter((r) => r.entries.length > 0)
      .sort((a, b) => b.total - a.total);
    const rankMap = new Map(ranked.map((r, i) => [r.student.id, i + 1]));
    return rows.map((r) => ({
      ...r,
      rank: rankMap.get(r.student.id) ?? null,
      cohort: ranked.length,
      school,
      exam,
    }));
  }, [q.data]);

  if (q.isLoading) return <div className="p-10 text-muted-foreground">Loading report cards…</div>;
  if (!q.data) return <div className="p-10 text-muted-foreground">No data.</div>;

  return (
    <div className="mx-auto max-w-[1000px] p-6">
      <div className="no-print flex items-end justify-between">
        <div>
          <Button asChild variant="ghost" size="sm" className="mb-2">
            <Link
              to="/manage/$schoolSlug/exams/$examId/analytics"
              params={{ schoolSlug, examId }}
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to analytics
            </Link>
          </Button>
          <h1 className="font-display text-2xl font-semibold">
            {q.data.exam.name} · Report cards
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {cards.length} report cards ready. Each card prints on its own page.
          </p>
        </div>
        <Button onClick={() => window.print()} className="bg-brand text-brand-foreground hover:bg-brand/90">
          <Printer className="mr-2 h-4 w-4" /> Print all
        </Button>
      </div>

      <div className="mt-6 space-y-6 print:space-y-0">
        {cards.map((c) => (
          <article
            key={c.student.id}
            className="report-card break-after-page rounded-2xl border border-border/60 bg-card p-8 shadow-sm print:rounded-none print:border-0 print:shadow-none"
          >
            <header className="flex items-start justify-between border-b border-border/60 pb-4">
              <div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  Student Report Card
                </div>
                <h2 className="mt-1 font-display text-xl font-semibold">{c.school.name}</h2>
                {c.school.motto && (
                  <p className="text-xs italic text-muted-foreground">{c.school.motto}</p>
                )}
              </div>
              {c.school.logo_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.school.logo_url} alt="" className="h-14 w-14 rounded-full object-cover" />
              )}
            </header>

            <div className="grid grid-cols-2 gap-3 py-4 text-sm md:grid-cols-4">
              <Field label="Student" value={c.student.full_name} />
              <Field label="Adm. No" value={c.student.admission_no} mono />
              <Field label="Exam" value={c.exam.name} />
              <Field label="Year" value={String(c.exam.year)} />
            </div>

            {c.entries.length === 0 ? (
              <p className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
                No marks recorded.
              </p>
            ) : (
              <>
                <table className="w-full text-sm">
                  <thead className="border-b border-border/60 text-left text-[10px] uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="py-2">Subject</th>
                      <th className="py-2 text-right">Score</th>
                      <th className="py-2 text-right">Grade</th>
                      <th className="py-2 text-right">Points</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {c.entries.map((e) => {
                      const g = gradeFor(e.score);
                      return (
                        <tr key={e.sub.id}>
                          <td className="py-1.5">{e.sub.name}</td>
                          <td className="py-1.5 text-right font-medium">{e.score.toFixed(0)}</td>
                          <td className="py-1.5 text-right">
                            <span className="rounded bg-secondary px-1.5 py-0.5 text-xs font-semibold">
                              {g.grade}
                            </span>
                          </td>
                          <td className="py-1.5 text-right text-muted-foreground">{g.points}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-secondary p-3 text-center md:grid-cols-5">
                  <Stat label="Subjects" value={String(c.entries.length)} />
                  <Stat label="Total" value={c.total.toFixed(0)} />
                  <Stat label="Average" value={c.avg.toFixed(1)} />
                  <Stat
                    label="Division"
                    value={c.division ? `Div ${c.division.division}` : "—"}
                    accent
                  />
                  <Stat
                    label="Position"
                    value={c.rank ? `${c.rank}/${c.cohort}` : "—"}
                  />
                </div>
              </>
            )}

            <footer className="mt-6 grid grid-cols-2 gap-8 text-xs text-muted-foreground">
              <SignatureLine label="Class Teacher" />
              <SignatureLine label="Head Teacher" />
            </footer>
          </article>
        ))}
      </div>
    </div>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`mt-0.5 font-medium ${mono ? "font-mono" : ""}`}>{value}</div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`font-display text-lg font-bold ${accent ? "text-brand" : ""}`}>{value}</div>
    </div>
  );
}

function SignatureLine({ label }: { label: string }) {
  return (
    <div>
      <div className="h-10 border-b border-dashed border-border/60" />
      <div className="mt-1 text-[10px] uppercase tracking-wider">{label}</div>
    </div>
  );
}