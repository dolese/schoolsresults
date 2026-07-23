import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Users } from "lucide-react";
import { getGenderAnalysis } from "@/lib/academic.functions";

export const Route = createFileRoute("/_authenticated/manage/$schoolSlug/reports/gender")({ component: Page });

function Page() {
  const { schoolSlug } = Route.useParams();
  const fn = useServerFn(getGenderAnalysis);
  const { data, isLoading } = useQuery({ queryKey: ["rep-gender", schoolSlug], queryFn: () => fn({ data: { slug: schoolSlug } }) });
  const max = Math.max(1, ...(data?.rows ?? []).map((r) => r.avg));

  return (
    <div className="p-6 md:p-10">
      <div className="mb-6 flex items-center gap-3">
        <Users className="h-5 w-5 text-muted-foreground" />
        <div>
          <h1 className="font-display text-2xl font-semibold">Gender analysis</h1>
          <p className="text-sm text-muted-foreground">Compare performance across genders.</p>
        </div>
      </div>
      {isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : (
        <div className="grid gap-4 md:grid-cols-3">
          {(data?.rows ?? []).map((r) => (
            <div key={r.gender} className="rounded-2xl border border-border/60 bg-card p-5">
              <div className="text-xs uppercase text-muted-foreground">{r.gender}</div>
              <div className="mt-1 font-display text-3xl font-semibold">{r.avg.toFixed(1)}<span className="text-base text-muted-foreground">%</span></div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary" style={{ width: `${(r.avg / max) * 100}%` }} />
              </div>
              <div className="mt-3 text-xs text-muted-foreground">{r.students} students · {r.entries} entries</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
