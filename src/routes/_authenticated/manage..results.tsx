import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Award, ArrowRight } from "lucide-react";
import { listExams } from "@/lib/manage.functions";

export const Route = createFileRoute("/_authenticated/manage/results")({ component: Page });

function Page() {
  const { schoolSlug } = Route.useParams();
  const fn = useServerFn(listExams);
  const { data, isLoading } = useQuery({ queryKey: ["results-overview", schoolSlug], queryFn: () => fn({ data: { slug: schoolSlug } }) });
  const published = (data?.exams ?? []).filter((e) => e.published);

  return (
    <div className="p-6 md:p-10">
      <div className="mb-6 flex items-center gap-3">
        <Award className="h-5 w-5 text-muted-foreground" />
        <div>
          <h1 className="font-display text-2xl font-semibold">Results overview</h1>
          <p className="text-sm text-muted-foreground">Jump into rankings, report cards, or analysis for a published exam.</p>
        </div>
      </div>
      {isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : (
        <div className="grid gap-3 md:grid-cols-2">
          {published.map((e) => (
            <div key={e.id} className="rounded-2xl border border-border/60 bg-card p-5">
              <div className="mb-2 flex items-center justify-between">
                <div>
                  <div className="font-display text-lg font-semibold">{e.name}</div>
                  <div className="text-xs text-muted-foreground">{(e.forms as { name: string } | null)?.name ?? "-"} · {e.year}</div>
                </div>
                <span className="rounded-full bg-green-500/15 px-2 py-0.5 text-xs font-medium text-green-600">Published</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link to="/_authenticated/manage/$schoolSlug/rankings" params={{ schoolSlug }} className="rounded-md border border-border/60 px-3 py-1.5 text-xs hover:bg-muted/40">Rankings <ArrowRight className="ml-1 inline h-3 w-3" /></Link>
                <Link to="/_authenticated/manage/$schoolSlug/reports/report-cards" params={{ schoolSlug }} className="rounded-md border border-border/60 px-3 py-1.5 text-xs hover:bg-muted/40">Report cards</Link>
                <Link to="/_authenticated/manage/$schoolSlug/exams/$examId" params={{ schoolSlug, examId: e.id }} className="rounded-md border border-border/60 px-3 py-1.5 text-xs hover:bg-muted/40">Open marks</Link>
              </div>
            </div>
          ))}
          {published.length === 0 && <p className="text-sm text-muted-foreground">No published exams yet.</p>}
        </div>
      )}
    </div>
  );
}
