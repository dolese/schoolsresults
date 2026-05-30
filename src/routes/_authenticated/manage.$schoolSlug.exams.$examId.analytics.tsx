import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { ArrowLeft, Download, Trophy, Users, TrendingUp, Award } from "lucide-react";
import { getExamAnalytics } from "@/lib/manage.functions";
import { gradeFor, computeDivision, NECTA_SCALE } from "@/lib/grading";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute(
  "/_authenticated/manage/$schoolSlug/exams/$examId/analytics",
)({
  head: () => ({ meta: [{ title: "Exam analytics — Dashboard" }] }),
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const { schoolSlug, examId } = Route.useParams();
  const fetchFn = useServerFn(getExamAnalytics);
  const q = useQuery({
    queryKey: ["exam-analytics", schoolSlug, examId],
    queryFn: () => fetchFn({ data: { slug: schoolSlug, examId } }),
  });

  const stats = useMemo(() => {
    if (!q.data) return null;
    const { students, subjects, marks } = q.data;
    const byStudent = new Map<string, Map<string, number>>();
    for (const m of marks) {
      if (m.score == null) continue;
      if (!byStudent.has(m.student_id)) byStudent.set(m.student_id, new Map());
      byStudent.get(m.student_id)!.set(m.subject_id, m.score);
    }

    const perStudent = students
      .map((s) => {
        const scoreMap = byStudent.get(s.id) ?? new Map();
        const scores = Array.from(scoreMap.values());
        const total = scores.reduce((a, b) => a + b, 0);
        const avg = scores.length ? total / scores.length : 0;
        const div = scores.length >= 4 ? computeDivision(scores) : null;
        return { ...s, scores, total, avg, division: div?.division ?? null, points: div?.points ?? null, entered: scores.length };
      })
      .filter((s) => s.entered > 0);

    const ranked = [...perStudent].sort((a, b) => b.total - a.total);
    ranked.forEach((s, i) => ((s as { rank?: number }).rank = i + 1));

    const divDist: Record<string, number> = { I: 0, II: 0, III: 0, IV: 0, "0": 0, "—": 0 };
    for (const s of perStudent) divDist[s.division ?? "—"] = (divDist[s.division ?? "—"] ?? 0) + 1;

    const subjectStats = subjects.map((sub) => {
      const ss: number[] = [];
      for (const st of perStudent) {
        const v = byStudent.get(st.id)?.get(sub.id);
        if (typeof v === "number") ss.push(v);
      }
      const total = ss.reduce((a, b) => a + b, 0);
      const avg = ss.length ? total / ss.length : 0;
      const passes = ss.filter((x) => x >= 30).length;
      const gradeCounts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, F: 0 };
      for (const x of ss) gradeCounts[gradeFor(x).grade]++;
      return { ...sub, attempted: ss.length, avg, pass: ss.length ? (passes / ss.length) * 100 : 0, gradeCounts };
    });

    const totalEntered = perStudent.length;
    const passing = perStudent.filter((s) => s.division && s.division !== "0").length;

    return { perStudent: ranked, divDist, subjectStats, totalEntered, passing, totalStudents: students.length };
  }, [q.data]);

  function exportCsv() {
    if (!q.data || !stats) return;
    const { subjects } = q.data;
    const header = ["Rank", "Adm. No", "Name", ...subjects.map((s) => s.code ?? s.name), "Total", "Average", "Points", "Division"];
    const rows = stats.perStudent.map((s) => {
      const r = s as typeof s & { rank: number };
      const scoreMap = new Map<string, number>();
      for (const sub of subjects) {
        const v = s.scores[subjects.indexOf(sub)];
        if (typeof v === "number") scoreMap.set(sub.id, v);
      }
      // rebuild via marks
      const subjScores = subjects.map((sub) => {
        const mark = q.data!.marks.find((m) => m.student_id === s.id && m.subject_id === sub.id);
        return mark?.score ?? "";
      });
      return [r.rank, s.admission_no, s.full_name, ...subjScores, s.total.toFixed(0), s.avg.toFixed(1), s.points ?? "", s.division ?? ""];
    });
    const csv = [header, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${q.data.exam.name.replace(/[^a-z0-9]+/gi, "_")}_results.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (q.isLoading) return <div className="p-10 text-muted-foreground">Loading analytics…</div>;
  if (!q.data || !stats) return <div className="p-10 text-muted-foreground">No data.</div>;

  const { exam } = q.data;
  const form = (exam.forms as { name: string } | null)?.name ?? "—";

  return (
    <div className="mx-auto max-w-[1200px] p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Button asChild variant="ghost" size="sm" className="mb-2">
            <Link to="/manage/$schoolSlug/exams" params={{ schoolSlug }}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to exams
            </Link>
          </Button>
          <h1 className="font-display text-2xl font-semibold">{exam.name} · Analytics</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {form} · {exam.year} · {stats.totalEntered} of {stats.totalStudents} students with marks
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCsv}>
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
          <Button asChild variant="outline">
            <Link to="/manage/$schoolSlug/exams/$examId" params={{ schoolSlug, examId }}>
              Edit marks
            </Link>
          </Button>
        </div>
      </div>

      {/* KPI tiles */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi icon={<Users className="h-4 w-4" />} label="Entered" value={`${stats.totalEntered}/${stats.totalStudents}`} />
        <Kpi
          icon={<TrendingUp className="h-4 w-4" />}
          label="Pass rate"
          value={`${stats.totalEntered ? ((stats.passing / stats.totalEntered) * 100).toFixed(0) : 0}%`}
        />
        <Kpi
          icon={<Award className="h-4 w-4" />}
          label="Class average"
          value={
            stats.totalEntered
              ? (stats.perStudent.reduce((a, b) => a + b.avg, 0) / stats.totalEntered).toFixed(1)
              : "—"
          }
        />
        <Kpi
          icon={<Trophy className="h-4 w-4" />}
          label="Top scorer"
          value={stats.perStudent[0]?.full_name?.split(" ")[0] ?? "—"}
          sub={stats.perStudent[0] ? `${stats.perStudent[0].total.toFixed(0)} pts` : undefined}
        />
      </div>

      {/* Division distribution */}
      <section className="mt-8 rounded-2xl border border-border/60 bg-card p-6">
        <h2 className="font-display text-lg font-semibold">Division distribution</h2>
        <p className="text-xs text-muted-foreground">NECTA divisions based on best 7 subjects</p>
        <div className="mt-4 grid grid-cols-5 gap-3">
          {(["I", "II", "III", "IV", "0"] as const).map((d) => {
            const n = stats.divDist[d] ?? 0;
            const pct = stats.totalEntered ? (n / stats.totalEntered) * 100 : 0;
            return (
              <div key={d} className="rounded-xl bg-secondary p-4 text-center">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">Div {d}</div>
                <div className="mt-1 font-display text-2xl font-bold text-brand">{n}</div>
                <div className="text-xs text-muted-foreground">{pct.toFixed(0)}%</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Subject performance */}
      <section className="mt-6 rounded-2xl border border-border/60 bg-card p-6">
        <h2 className="font-display text-lg font-semibold">Subject performance</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="py-2">Subject</th>
                <th className="py-2 text-right">Entered</th>
                <th className="py-2 text-right">Avg</th>
                <th className="py-2 text-right">Pass %</th>
                {NECTA_SCALE.map((g) => (
                  <th key={g.grade} className="py-2 text-right">{g.grade}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {stats.subjectStats.map((s) => (
                <tr key={s.id}>
                  <td className="py-2.5 font-medium">{s.name}</td>
                  <td className="py-2.5 text-right">{s.attempted}</td>
                  <td className="py-2.5 text-right">{s.avg.toFixed(1)}</td>
                  <td className="py-2.5 text-right">
                    <span className={s.pass >= 50 ? "text-success" : "text-destructive"}>
                      {s.pass.toFixed(0)}%
                    </span>
                  </td>
                  {NECTA_SCALE.map((g) => (
                    <td key={g.grade} className="py-2.5 text-right text-muted-foreground">
                      {s.gradeCounts[g.grade]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Top performers */}
      <section className="mt-6 rounded-2xl border border-border/60 bg-card p-6">
        <h2 className="font-display text-lg font-semibold">Class ranking</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="py-2">#</th>
                <th className="py-2">Student</th>
                <th className="py-2 text-right">Subjects</th>
                <th className="py-2 text-right">Total</th>
                <th className="py-2 text-right">Avg</th>
                <th className="py-2 text-right">Points</th>
                <th className="py-2 text-right">Div</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {stats.perStudent.map((s, i) => (
                <tr key={s.id} className={i < 3 ? "bg-secondary/40" : ""}>
                  <td className="py-2 font-mono">{i + 1}</td>
                  <td className="py-2">
                    <div className="font-medium">{s.full_name}</div>
                    <div className="font-mono text-xs text-muted-foreground">{s.admission_no}</div>
                  </td>
                  <td className="py-2 text-right text-muted-foreground">{s.entered}</td>
                  <td className="py-2 text-right font-medium">{s.total.toFixed(0)}</td>
                  <td className="py-2 text-right">{s.avg.toFixed(1)}</td>
                  <td className="py-2 text-right">{s.points ?? "—"}</td>
                  <td className="py-2 text-right">
                    <span className="rounded-md bg-secondary px-2 py-0.5 font-semibold text-brand">
                      {s.division ?? "—"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Kpi({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="mt-2 font-display text-2xl font-bold">{value}</div>
      {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}