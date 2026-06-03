import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, Crown, Medal, Trophy } from "lucide-react";
import { z } from "zod";
import { getPublicLeaderboard } from "@/lib/schools.functions";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const searchSchema = z.object({
  examId: z.string().optional(),
});

export const Route = createFileRoute("/$schoolSlug/leaderboard")({
  validateSearch: (s) => searchSchema.parse(s),
  loaderDeps: ({ search }) => ({ examId: search.examId ?? null }),
  loader: async ({ params, deps }) => {
    const data = await getPublicLeaderboard({
      data: { slug: params.schoolSlug, examId: deps.examId, limit: 25 },
    });
    if (!data) throw notFound();
    return data;
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `Top performers — ${loaderData.school.name}` },
          {
            name: "description",
            content: `Top performing students at ${loaderData.school.name}.`,
          },
        ]
      : [{ title: "School not found" }],
  }),
  component: LeaderboardPage,
});

function LeaderboardPage() {
  const { schoolSlug } = Route.useParams();
  const initial = Route.useLoaderData();
  const [examId, setExamId] = useState<string>(initial.exam?.id ?? "");
  const fetchFn = useServerFn(getPublicLeaderboard);
  const q = useQuery({
    queryKey: ["leaderboard", schoolSlug, examId],
    queryFn: () =>
      fetchFn({ data: { slug: schoolSlug, examId: examId || null, limit: 25 } }),
    initialData: initial,
  });

  const data = q.data;
  const medals = [Crown, Trophy, Medal];
  const medalColors = ["text-amber-500", "text-slate-400", "text-orange-600"];

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,oklch(0.99_0.005_240),oklch(0.97_0.01_245))]">
      <header className="border-b border-border/60 bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <Button asChild variant="ghost" size="sm">
            <Link to="/$schoolSlug" params={{ schoolSlug }}>
              <ArrowLeft className="mr-2 h-4 w-4" /> {data.school.name}
            </Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-10">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/90 px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm">
              <Trophy className="h-3.5 w-3.5 text-brand" /> Top performers
            </span>
            <h1 className="mt-3 font-display text-4xl font-semibold leading-tight">
              Leaderboard
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Highest total scores from published exams at {data.school.name}.
            </p>
          </div>
          {data.exams.length > 0 && (
            <Select value={examId} onValueChange={setExamId}>
              <SelectTrigger className="w-full md:w-[280px]">
                <SelectValue placeholder="Choose an exam" />
              </SelectTrigger>
              <SelectContent>
                {data.exams.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.name} — {e.form ?? "All forms"} — {e.year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {!data.exam ? (
          <div className="rounded-3xl border border-dashed border-border/60 bg-card p-12 text-center">
            <Trophy className="mx-auto h-8 w-8 text-muted-foreground" />
            <h2 className="mt-4 font-display text-xl font-semibold">
              No published exams yet
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Once the school publishes exam results, top performers appear here.
            </p>
          </div>
        ) : data.entries.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border/60 bg-card p-12 text-center text-muted-foreground">
            No marks recorded for this exam yet.
          </div>
        ) : (
          <>
            <div className="mb-6 grid gap-4 md:grid-cols-3">
              {data.entries.slice(0, 3).map((e, i) => {
                const Icon = medals[i];
                return (
                  <Link
                    key={e.id}
                    to="/$schoolSlug/results/$studentId"
                    params={{ schoolSlug, studentId: e.id }}
                    search={{ examId: data.exam!.id } as never}
                    className="group rounded-3xl border border-border/60 bg-card p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                        Rank {i + 1}
                      </span>
                      <Icon className={`h-6 w-6 ${medalColors[i]}`} />
                    </div>
                    <div className="mt-4 font-display text-xl font-semibold group-hover:text-brand">
                      {e.full_name}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {e.admission_no} · {e.form ?? "—"}{e.stream ? ` · ${e.stream}` : ""}
                    </div>
                    <div className="mt-5 flex items-end justify-between">
                      <div>
                        <div className="font-display text-3xl font-semibold">
                          {e.total.toFixed(0)}
                        </div>
                        <div className="text-xs text-muted-foreground">total points</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{e.avg.toFixed(1)}</div>
                        <div className="text-xs text-muted-foreground">avg / {e.subjects} subj</div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            <div className="overflow-hidden rounded-3xl border border-border/60 bg-card shadow-sm">
              <table className="w-full text-sm">
                <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">#</th>
                    <th className="px-4 py-3">Student</th>
                    <th className="px-4 py-3">Form</th>
                    <th className="px-4 py-3 text-right">Subjects</th>
                    <th className="px-4 py-3 text-right">Avg</th>
                    <th className="px-4 py-3 text-right">Total</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {data.entries.map((e, i) => (
                    <tr key={e.id} className="hover:bg-accent/20">
                      <td className="px-4 py-3 font-mono text-muted-foreground">{i + 1}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{e.full_name}</div>
                        <div className="font-mono text-xs text-muted-foreground">
                          {e.admission_no}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {e.form ?? "—"}
                        {e.stream ? ` · ${e.stream}` : ""}
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground">{e.subjects}</td>
                      <td className="px-4 py-3 text-right text-muted-foreground">
                        {e.avg.toFixed(1)}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold">{e.total.toFixed(0)}</td>
                      <td className="px-4 py-3 text-right">
                        <Button asChild size="sm" variant="ghost">
                          <Link
                            to="/$schoolSlug/results/$studentId"
                            params={{ schoolSlug, studentId: e.id }}
                            search={{ examId: data.exam!.id } as never}
                          >
                            View
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="mt-4 text-xs text-muted-foreground">
              Ranked by total points across all subjects for{" "}
              <span className="font-medium text-foreground">{data.exam.name}</span> ({data.exam.year}).
            </p>
          </>
        )}
      </main>
    </div>
  );
}