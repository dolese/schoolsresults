import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Award } from "lucide-react";
import { getNectaAnalysis } from "@/lib/academic.functions";

export const Route = createFileRoute("/_authenticated/manage/$schoolSlug/reports/necta")({ component: Page });

function Page() {
  const { schoolSlug } = Route.useParams();
  const fn = useServerFn(getNectaAnalysis);
  const { data, isLoading } = useQuery({ queryKey: ["rep-necta", schoolSlug], queryFn: () => fn({ data: { slug: schoolSlug } }) });

  return (
    <div className="p-6 md:p-10">
      <div className="mb-6 flex items-center gap-3">
        <Award className="h-5 w-5 text-muted-foreground" />
        <div>
          <h1 className="font-display text-2xl font-semibold">NECTA division analysis</h1>
          <p className="text-sm text-muted-foreground">Division breakdown using best 7 subjects per student.</p>
        </div>
      </div>
      {isLoading || !data ? <p className="text-sm text-muted-foreground">Loading…</p> : (
        <>
          <div className="mb-4 text-sm text-muted-foreground">{data.assessed} students assessed (≥4 subjects)</div>
          <div className="grid gap-3 grid-cols-2 md:grid-cols-5">
            {(["I", "II", "III", "IV", "0"] as const).map((d) => (
              <div key={d} className="rounded-2xl border border-border/60 bg-card p-5 text-center">
                <div className="text-xs uppercase text-muted-foreground">Division</div>
                <div className="font-display text-3xl font-semibold text-primary">{d}</div>
                <div className="mt-2 text-2xl font-semibold">{data.divisions[d] ?? 0}</div>
                <div className="text-xs text-muted-foreground">students</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
