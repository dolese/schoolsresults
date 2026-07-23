import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { CalendarRange, Check, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { listAcademicYears, addAcademicYear, setCurrentAcademicYear, deleteAcademicYear } from "@/lib/academic.functions";

export const Route = createFileRoute("/_authenticated/manage/$schoolSlug/years")({ component: Page });

function Page() {
  const { schoolSlug } = Route.useParams();
  const qc = useQueryClient();
  const list = useServerFn(listAcademicYears);
  const add = useServerFn(addAcademicYear);
  const setCurrent = useServerFn(setCurrentAcademicYear);
  const del = useServerFn(deleteAcademicYear);
  const key = ["years", schoolSlug];
  const { data, isLoading } = useQuery({ queryKey: key, queryFn: () => list({ data: { slug: schoolSlug } }) });
  const [year, setYear] = useState<string>(String(new Date().getFullYear()));
  const invalidate = () => qc.invalidateQueries({ queryKey: key });

  const addMut = useMutation({ mutationFn: (y: number) => add({ data: { slug: schoolSlug, year: y } }), onSuccess: () => { toast.success("Year added"); invalidate(); }, onError: (e: Error) => toast.error(e.message) });
  const curMut = useMutation({ mutationFn: (id: string) => setCurrent({ data: { slug: schoolSlug, id } }), onSuccess: () => { toast.success("Current year updated"); invalidate(); } });
  const delMut = useMutation({ mutationFn: (id: string) => del({ data: { slug: schoolSlug, id } }), onSuccess: () => { toast.success("Year removed"); invalidate(); }, onError: (e: Error) => toast.error(e.message) });

  return (
    <div className="p-6 md:p-10">
      <div className="mb-6 flex items-center gap-3">
        <CalendarRange className="h-5 w-5 text-muted-foreground" />
        <div>
          <h1 className="font-display text-2xl font-semibold">Academic years</h1>
          <p className="text-sm text-muted-foreground">Configure academic years and mark the current one.</p>
        </div>
      </div>

      <div className="mb-6 flex items-end gap-3 rounded-2xl border border-border/60 bg-card p-4">
        <div className="flex-1 max-w-[200px]">
          <label className="mb-1 block text-xs uppercase tracking-wide text-muted-foreground">Add year</label>
          <Input type="number" value={year} onChange={(e) => setYear(e.target.value)} />
        </div>
        <Button onClick={() => addMut.mutate(Number(year))} disabled={addMut.isPending}>Add year</Button>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card">
        {isLoading ? (
          <p className="p-6 text-sm text-muted-foreground">Loading…</p>
        ) : (data?.years ?? []).length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">No academic years yet.</p>
        ) : (
          <div className="divide-y divide-border/60">
            {data!.years.map((y) => (
              <div key={y.id} className="flex items-center justify-between p-4">
                <div>
                  <div className="font-medium">{y.year}</div>
                  <div className="text-xs text-muted-foreground">{new Date(y.created_at).toLocaleDateString()}</div>
                </div>
                <div className="flex items-center gap-2">
                  {y.is_current ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"><Check className="h-3 w-3" /> Current</span>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => curMut.mutate(y.id)}>Set current</Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => delMut.mutate(y.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
