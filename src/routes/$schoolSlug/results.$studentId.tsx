import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Printer, LineChart, Info } from "lucide-react";
import { getPublicStudentResult } from "@/lib/schools.functions";
import { gradeFor, computeDivision } from "@/lib/grading";
import { Button } from "@/components/ui/button";
import { PublicSchoolNav } from "@/components/site/PublicSchoolNav";

export const Route = createFileRoute("/$schoolSlug/results/$studentId")({
  validateSearch: (search: Record<string, unknown>) => ({
    examId: typeof search.examId === "string" ? search.examId : undefined,
  }),
  loaderDeps: ({ search }) => ({ examId: search.examId }),
  loader: async ({ params, deps }) => {
    try {
      return await getPublicStudentResult({
        data: {
          slug: params.schoolSlug,
          studentId: params.studentId,
          examId: deps.examId ?? null,
        },
      });
    } catch {
      throw notFound();
    }
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.student.full_name} — Results` },
          {
            name: "description",
            content: `Published exam results for ${loaderData.student.full_name} at ${loaderData.school.name}.`,
          },
          {
            property: "og:title",
            content: `${loaderData.student.full_name} — Results`,
          },
          {
            property: "og:url",
            content: `https://schoolsresults.lovable.app/${loaderData.school.slug}/results/${loaderData.student.id}`,
          },
          { name: "robots", content: "noindex" },
        ]
      : [{ title: "Result not found" }],
    links: loaderData
      ? [
          {
            rel: "canonical",
            href: `https://schoolsresults.lovable.app/${loaderData.school.slug}/results/${loaderData.student.id}`,
          },
        ]
      : [],
  }),
  component: ResultPage,
  notFoundComponent: () => (
    <div className="grid min-h-screen place-items-center text-center">
      <div>
        <h1 className="font-display text-2xl font-semibold">Result not available</h1>
        <Button asChild className="mt-4">
          <Link to="/">Go home</Link>
        </Button>
      </div>
    </div>
  ),
});

function ResultPage() {
  const { school, student, exam, marks, rank, cohortSize } = Route.useLoaderData();
  const scores = (marks as Array<{ subject: string; code: string | null; score: number }>).map(
    (mark) => mark.score,
  );
  const div = scores.length >= 4 ? computeDivision(scores) : null;
  const total = scores.reduce((a: number, b: number) => a + b, 0);
  const avg = scores.length ? total / scores.length : 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="no-print">
        <PublicSchoolNav school={school} />
      </div>
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="mb-3 flex flex-wrap justify-end gap-2 no-print">
          <div className="flex gap-2">
            <Button asChild size="sm" variant="outline">
              <Link
                to="/$schoolSlug/students/$studentId/history"
                params={{ schoolSlug: school.slug, studentId: student.id }}
              >
                <LineChart className="mr-2 h-4 w-4" /> View progress
              </Link>
            </Button>
            <Button size="sm" variant="outline" onClick={() => window.print()}>
              <Printer className="mr-2 h-4 w-4" /> Print / Save as PDF
            </Button>
          </div>
        </div>
        <div className="print-area rounded-3xl border border-border/60 bg-card p-8 shadow-xl">
          <div className="flex items-start justify-between border-b border-border/60 pb-6">
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Result Slip</div>
              <h1 className="mt-1 font-display text-2xl font-semibold">{school.name}</h1>
              {school.motto && <p className="text-sm italic text-muted-foreground">{school.motto}</p>}
            </div>
            {school.logo_url && (
              <img src={school.logo_url} alt="" className="h-16 w-16 rounded-full object-cover" />
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 py-6 text-sm">
            <div>
              <div className="text-muted-foreground">Student</div>
              <div className="font-medium">{student.full_name}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Admission No.</div>
              <div className="font-medium">{student.admission_no}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Class</div>
              <div className="font-medium">
                {(student.forms as { name: string } | null)?.name ?? "No form"}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Year</div>
              <div className="font-medium">{student.year}</div>
            </div>
          </div>

          {!exam ? (
            <p className="rounded-xl bg-muted p-4 text-sm text-muted-foreground">
              No published exam results yet.
            </p>
          ) : (
            <>
              <div className="mb-3 flex items-center justify-between">
                <div className="font-display text-lg font-semibold">{exam.name}</div>
                <span className="rounded-full bg-success/15 px-3 py-1 text-xs font-medium text-success">
                  Published
                </span>
              </div>
              <table className="w-full text-sm">
                <thead className="border-b border-border/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="py-2">Subject</th>
                    <th className="py-2 text-right">Score</th>
                    <th className="py-2 text-right">Grade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {(marks as Array<{ subject: string; code: string | null; score: number }>).map(
                    (mark, index) => {
                      const grade = gradeFor(mark.score);
                      return (
                        <tr key={index}>
                          <td className="py-2.5">{mark.subject}</td>
                          <td className="py-2.5 text-right font-medium">{mark.score.toFixed(0)}</td>
                          <td className="py-2.5 text-right">
                            <span
                              className={`inline-block min-w-7 rounded-md px-2 py-0.5 text-center font-semibold ${gradeBadge(grade.grade)}`}
                            >
                              {grade.grade}
                            </span>
                          </td>
                        </tr>
                      );
                    },
                  )}
                </tbody>
              </table>

              <div className="mt-6 grid grid-cols-2 gap-4 rounded-xl bg-secondary p-4 text-center md:grid-cols-4">
                <div>
                  <div className="text-xs text-muted-foreground">Total</div>
                  <div className="font-display text-xl font-bold">{total.toFixed(0)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Average</div>
                  <div className="font-display text-xl font-bold">{avg.toFixed(1)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Division</div>
                  <div className="font-display text-xl font-bold text-brand">
                    {div ? `Div ${div.division}` : "-"}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Position</div>
                  <div className="font-display text-xl font-bold">
                    {rank ? `${rank}/${cohortSize}` : "-"}
                  </div>
                </div>
              </div>

              <div className="mt-6 rounded-xl border border-border/60 bg-background p-4 text-xs text-muted-foreground no-print">
                <div className="mb-2 flex items-center gap-2 font-medium text-foreground">
                  <Info className="h-3.5 w-3.5 text-brand" /> NECTA grading
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    ["A", "75–100"],
                    ["B", "65–74"],
                    ["C", "45–64"],
                    ["D", "30–44"],
                    ["F", "0–29"],
                  ].map(([g, r]) => (
                    <span
                      key={g}
                      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 ${gradeBadge(g)}`}
                    >
                      <span className="font-semibold">{g}</span>
                      <span className="opacity-80">{r}</span>
                    </span>
                  ))}
                </div>
                <p className="mt-2">
                  Division is computed from the best 7 subjects (lower points = better
                  division).
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function gradeBadge(g: string) {
  switch (g) {
    case "A":
      return "bg-success/15 text-success";
    case "B":
      return "bg-brand/15 text-brand";
    case "C":
      return "bg-amber-500/15 text-amber-700 dark:text-amber-400";
    case "D":
      return "bg-orange-500/15 text-orange-700 dark:text-orange-400";
    case "F":
      return "bg-destructive/15 text-destructive";
    default:
      return "bg-secondary text-foreground";
  }
}
