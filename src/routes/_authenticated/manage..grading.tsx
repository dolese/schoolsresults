import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Scale, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getGradingScale, resetGradingScale } from "@/lib/academic.functions";

export const Route = createFileRoute("/_authenticated/manage/grading")({ component: Page });

function Page() {
  const { schoolSlug } = Route.useParams();
  const qc = useQueryClient();
  const get = useServerFn(getGradingScale);
  const reset = useServerFn(resetGradingScale);
  const key = ["grading", schoolSlug];
  const { data, isLoading } = useQuery({ queryKey: key, queryFn: () => get({ data: { slug: schoolSlug } }) });
  const resetMut = useMutation({ mutationFn: () => reset({ data: { slug: schoolSlug } }), onSuccess: () => { toast.success("Reset to NECTA standard"); qc.invalidateQueries({ queryKey: key }); } });

  return (
    <div className="p-6 md:p-10">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Scale className="h-5 w-5 text-muted-foreground" />
          <div>
            <h1 className="font-display text-2xl font-semibold">Grading system</h1>
            <p className="text-sm text-muted-foreground">NECTA-aligned grade bands and division thresholds.</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => resetMut.mutate()} disabled={resetMut.isPending}><RotateCcw className="mr-2 h-4 w-4" /> Reset to NECTA</Button>
      </div>

      {isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-border/60 bg-card p-5">
            <h2 className="mb-3 font-display text-lg font-semibold">Grade bands</h2>
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs uppercase text-muted-foreground"><th className="py-2">Grade</th><th>Range</th><th>Points</th></tr></thead>
              <tbody>
                {data!.scale.map((b) => (
                  <tr key={b.grade} className="border-t border-border/50">
                    <td className="py-2 font-semibold">{b.grade}</td>
                    <td>{b.min}–{b.max}</td>
                    <td>{b.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="rounded-2xl border border-border/60 bg-card p-5">
            <h2 className="mb-3 font-display text-lg font-semibold">Divisions</h2>
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs uppercase text-muted-foreground"><th className="py-2">Division</th><th>Points range</th></tr></thead>
              <tbody>
                {data!.divisions.map((d) => (
                  <tr key={d.division} className="border-t border-border/50">
                    <td className="py-2 font-semibold">{d.division}</td>
                    <td>{d.min}–{d.max}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-3 text-xs text-muted-foreground">Divisions are computed from the best 7 subject points.</p>
          </div>
        </div>
      )}
    </div>
  );
}
