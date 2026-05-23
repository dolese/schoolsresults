import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, Printer } from "lucide-react";
import { getPublicStudentResult } from "@/lib/schools.functions";
import { gradeFor, computeDivision } from "@/lib/grading";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/$schoolSlug/results/$studentId")({
  loader: async ({ params }) => {
    try {
      return await getPublicStudentResult({ data: { slug: params.schoolSlug, studentId: params.studentId } });
    } catch {
      throw notFound();
    }
  },
  head: ({ loaderData }) => ({
    meta: [{ title: loaderData ? `${loaderData.student.full_name} — Results` : "Result not found" }],
  }),
  component: ResultPage,
  notFoundComponent: () => (
    <div className="grid min-h-screen place-items-center text-center">
      <div>
        <h1 className="font-display text-2xl font-semibold">Result not available</h1>
        <Button asChild className="mt-4"><Link to="/">Go home</Link></Button>
      </div>
    </div>
  ),
});

function ResultPage() {
  const { school, student, exam, marks } = Route.useLoaderData();
  const scores = (marks as Array<{ subject: string; code: string | null; score: number }>).map((m) => m.score);
  const div = scores.length >= 4 ? computeDivision(scores) : null;
  const total = scores.reduce((a: number, b: number) => a + b, 0);
  const avg = scores.length ? total / scores.length : 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-10">
        <Button asChild variant="ghost" size="sm" className="mb-4">
          <Link to="/$schoolSlug" params={{ schoolSlug: school.slug }}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Link>
        </Button>
        <div className="mb-3 flex justify-end no-print">
          <Button size="sm" variant="outline" onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" /> Print / Save as PDF
          </Button>
        </div>
        <div className="print-area rounded-3xl border border-border/60 bg-card p-8 shadow-xl">
          <div className="flex items-start justify-between border-b border-border/60 pb-6">
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Result Slip</div>
              <h1 className="font-display mt-1 text-2xl font-semibold">{school.name}</h1>
              {school.motto && <p className="text-sm italic text-muted-foreground">{school.motto}</p>}
            </div>
            {school.logo_url && <img src={school.logo_url} alt="" className="h-16 w-16 rounded-full object-cover" />}
          </div>

          <div className="grid grid-cols-2 gap-4 py-6 text-sm">
            <div><div className="text-muted-foreground">Student</div><div className="font-medium">{student.full_name}</div></div>
            <div><div className="text-muted-foreground">Admission No.</div><div className="font-medium">{student.admission_no}</div></div>
            <div><div className="text-muted-foreground">Class</div><div className="font-medium">{(student.forms as { name: string } | null)?.name ?? "—"}</div></div>
            <div><div className="text-muted-foreground">Year</div><div className="font-medium">{student.year}</div></div>
          </div>

          {!exam ? (
            <p className="rounded-xl bg-muted p-4 text-sm text-muted-foreground">No published exam results yet.</p>
          ) : (
            <>
              <div className="mb-3 flex items-center justify-between">
                <div className="font-display text-lg font-semibold">{exam.name}</div>
                <span className="rounded-full bg-success/15 px-3 py-1 text-xs font-medium text-success">Published</span>
              </div>
              <table className="w-full text-sm">
                <thead className="border-b border-border/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <tr><th className="py-2">Subject</th><th className="py-2 text-right">Score</th><th className="py-2 text-right">Grade</th></tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {(marks as Array<{ subject: string; code: string | null; score: number }>).map((m, i) => {
                    const g = gradeFor(m.score);
                    return (
                      <tr key={i}>
                        <td className="py-2.5">{m.subject}</td>
                        <td className="py-2.5 text-right font-medium">{m.score.toFixed(0)}</td>
                        <td className="py-2.5 text-right"><span className="rounded-md bg-secondary px-2 py-0.5 font-semibold">{g.grade}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div className="mt-6 grid grid-cols-3 gap-4 rounded-xl bg-secondary p-4 text-center">
                <div><div className="text-xs text-muted-foreground">Total</div><div className="font-display text-xl font-bold">{total.toFixed(0)}</div></div>
                <div><div className="text-xs text-muted-foreground">Average</div><div className="font-display text-xl font-bold">{avg.toFixed(1)}</div></div>
                <div>
                  <div className="text-xs text-muted-foreground">Division</div>
                  <div className="font-display text-xl font-bold text-brand">{div ? `Div ${div.division}` : "—"}</div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
