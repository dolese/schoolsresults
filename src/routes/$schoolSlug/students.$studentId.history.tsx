import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { getPublicStudentHistory } from "@/lib/schools.functions";
import { computeDivision, gradeFor } from "@/lib/grading";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/$schoolSlug/students/$studentId/history")({
  loader: async ({ params }) => {
    try {
      return await getPublicStudentHistory({
        data: { slug: params.schoolSlug, studentId: params.studentId },
      });
    } catch {
      throw notFound();
    }
  },
  head: ({ loaderData }) => ({
    meta: [
      {
        title: loaderData
          ? `${loaderData.student.full_name} — Progress`
          : "Student not found",
      },
    ],
  }),
  component: HistoryPage,
  notFoundComponent: () => (
    <div className="grid min-h-screen place-items-center text-center">
      <div>
        <h1 className="font-display text-2xl font-semibold">Student not found</h1>
        <Button asChild className="mt-4">
          <Link to="/">Go home</Link>
        </Button>
      </div>
    </div>
  ),
});

function HistoryPage() {
  const { school, student, history } = Route.useLoaderData();

  const rows = history.map((h) => {
    const scores = h.scores.map((s) => s.score);
    const total = scores.reduce((a, b) => a + b, 0);
    const avg = scores.length ? total / scores.length : 0;
    const div = scores.length >= 4 ? computeDivision(scores) : null;
    return { ...h, total, avg, division: div };
  });

  const best = rows.reduce<typeof rows[number] | null>(
    (a, b) => (a == null || b.avg > a.avg ? b : a),
    null,
  );
  const overallAvg = rows.length
    ? rows.reduce((s, r) => s + r.avg, 0) / rows.length
    : 0;

  const maxAvg = Math.max(100, ...rows.map((r) => r.avg));

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-10">
        <Button asChild variant="ghost" size="sm" className="mb-4">
          <Link
            to="/$schoolSlug/results/$studentId"
            params={{ schoolSlug: school.slug, studentId: student.id }}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to result slip
          </Link>
        </Button>

        <div className="mb-6 flex items-start justify-between border-b border-border/60 pb-6">
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              Performance history
            </div>
            <h1 className="mt-1 font-display text-2xl font-semibold">
              {student.full_name}
            </h1>
            <p className="text-sm text-muted-foreground">
              {school.name} ·{" "}
              <span className="font-mono">{student.admission_no}</span>
              {" · "}
              {(student.forms as { name: string } | null)?.name ?? "—"}
            </p>
          </div>
          {school.logo_url && (
            <img
              src={school.logo_url}
              alt=""
              className="h-14 w-14 rounded-full object-cover"
            />
          )}
        </div>

        {rows.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/60 p-10 text-center text-muted-foreground">
            No published exam history yet.
          </div>
        ) : (
          <>
            <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
              <Tile label="Exams sat" value={String(rows.length)} />
              <Tile label="Overall avg" value={overallAvg.toFixed(1)} accent />
              <Tile
                label="Best exam"
                value={best ? best.avg.toFixed(1) : "—"}
              />
              <Tile
                label="Latest division"
                value={
                  rows[rows.length - 1]?.division
                    ? `Div ${rows[rows.length - 1]!.division!.division}`
                    : "—"
                }
              />
            </div>

            <section className="mb-8 rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
              <h2 className="mb-4 font-display text-lg font-semibold">
                Average trend
              </h2>
              <div className="flex h-48 items-end gap-2">
                {rows.map((r, i) => {
                  const h = (r.avg / maxAvg) * 100;
                  const prev = i > 0 ? rows[i - 1].avg : null;
                  const delta =
                    prev == null ? 0 : r.avg - prev;
                  return (
                    <div
                      key={r.id}
                      className="group flex flex-1 flex-col items-center gap-1"
                    >
                      <div className="text-[10px] font-semibold text-muted-foreground">
                        {r.avg.toFixed(0)}
                      </div>
                      <div
                        className="w-full rounded-t-md bg-gradient-to-t from-brand/30 to-brand"
                        style={{ height: `${Math.max(4, h)}%` }}
                        title={`${r.name}: ${r.avg.toFixed(1)}`}
                      />
                      <div className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                        {delta > 0.5 ? (
                          <TrendingUp className="h-3 w-3 text-success" />
                        ) : delta < -0.5 ? (
                          <TrendingDown className="h-3 w-3 text-destructive" />
                        ) : (
                          <Minus className="h-3 w-3" />
                        )}
                        <span className="truncate max-w-[60px]">
                          {r.name}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="rounded-2xl border border-border/60 bg-card shadow-sm">
              <div className="border-b border-border/60 p-6">
                <h2 className="font-display text-lg font-semibold">
                  Exam-by-exam breakdown
                </h2>
                <p className="text-xs text-muted-foreground">
                  Most recent exams last.
                </p>
              </div>
              <ol className="divide-y divide-border/60">
                {rows.map((r) => (
                  <li key={r.id} className="p-6">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <div>
                        <div className="font-display text-base font-semibold">
                          {r.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {r.year} · {r.type.replace("_", "-")} ·{" "}
                          {r.scores.length} subjects
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <Stat label="Total" value={r.total.toFixed(0)} />
                        <Stat label="Avg" value={r.avg.toFixed(1)} />
                        <Stat
                          label="Div"
                          value={r.division ? r.division.division : "—"}
                          accent
                        />
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {r.scores.map((s, i) => {
                        const g = gradeFor(s.score);
                        return (
                          <span
                            key={i}
                            className="rounded-md bg-secondary px-2 py-1 text-xs"
                            title={`${s.subject}: ${s.score}`}
                          >
                            {s.code ?? s.subject.slice(0, 3).toUpperCase()}{" "}
                            <span className="font-semibold">{g.grade}</span>
                          </span>
                        );
                      })}
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          </>
        )}
      </div>
    </div>
  );
}

function Tile({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div
        className={`mt-1 font-display text-2xl font-bold ${accent ? "text-brand" : ""}`}
      >
        {value}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="text-center">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div
        className={`font-display text-base font-bold ${accent ? "text-brand" : ""}`}
      >
        {value}
      </div>
    </div>
  );
}