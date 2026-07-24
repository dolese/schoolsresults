import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Lock, Unlock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { listExams, setExamPublished } from "@/lib/manage.functions";

export const Route = createFileRoute("/_authenticated/manage/$schoolSlug/assessment/locks")({ component: Page });

function Page() {
  const { schoolSlug } = Route.useParams();
  const qc = useQueryClient();
  const list = useServerFn(listExams);
  const setPub = useServerFn(setExamPublished);
  const key = ["lock-exams", schoolSlug];
  const { data, isLoading } = useQuery({ queryKey: key, queryFn: () => list({ data: { slug: schoolSlug } }) });
  const mut = useMutation({
    mutationFn: (v: { id: string; published: boolean }) => setPub({ data: { slug: schoolSlug, ...v } }),
    onSuccess: (_r, v) => { toast.success(v.published ? "Locked" : "Unlocked"); qc.invalidateQueries({ queryKey: key }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="p-6 md:p-10">
      <div className="mb-6 flex items-center gap-3">
        <Lock className="h-5 w-5 text-muted-foreground" />
        <div>
          <h1 className="font-display text-2xl font-semibold">Lock / unlock results</h1>
          <p className="text-sm text-muted-foreground">Published exams are read-only; unpublish to reopen entry.</p>
        </div>
      </div>
      {isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {(data?.exams ?? []).map((e) => (
            <div key={e.id} className="rounded-2xl border border-border/60 bg-card p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold">{e.name}</div>
                  <div className="text-xs text-muted-foreground">{(e.forms as { name: string } | null)?.name ?? "-"} · {e.year}</div>
                </div>
                {e.published
                  ? <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-600"><Lock className="h-3 w-3" /> Locked</span>
                  : <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"><Unlock className="h-3 w-3" /> Open</span>}
              </div>
              <Button size="sm" variant={e.published ? "outline" : "default"} className="mt-4 w-full" disabled={mut.isPending} onClick={() => mut.mutate({ id: e.id, published: !e.published })}>
                {e.published ? "Unlock (unpublish)" : "Lock (publish)"}
              </Button>
            </div>
          ))}
          {(data?.exams ?? []).length === 0 && <p className="col-span-full text-sm text-muted-foreground">No exams yet.</p>}
        </div>
      )}
    </div>
  );
}
