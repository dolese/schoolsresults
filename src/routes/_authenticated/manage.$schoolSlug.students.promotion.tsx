import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { listClassesAndStreams, promoteStudents } from "@/lib/academic.functions";

export const Route = createFileRoute("/_authenticated/manage/$schoolSlug/students/promotion")({ component: Page });

function Page() {
  const { schoolSlug } = Route.useParams();
  const qc = useQueryClient();
  const list = useServerFn(listClassesAndStreams);
  const promote = useServerFn(promoteStudents);
  const { data } = useQuery({ queryKey: ["promote-forms", schoolSlug], queryFn: () => list({ data: { slug: schoolSlug } }) });
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const mut = useMutation({
    mutationFn: () => promote({ data: { slug: schoolSlug, from_form_id: from, to_form_id: to } }),
    onSuccess: (r) => { toast.success(`Promoted ${r.count} students`); qc.invalidateQueries({ queryKey: ["promote-forms", schoolSlug] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="p-6 md:p-10">
      <div className="mb-6 flex items-center gap-3">
        <ArrowUpRight className="h-5 w-5 text-muted-foreground" />
        <div>
          <h1 className="font-display text-2xl font-semibold">Student promotion</h1>
          <p className="text-sm text-muted-foreground">Bulk move all students from one form to another.</p>
        </div>
      </div>
      <div className="max-w-lg rounded-2xl border border-border/60 bg-card p-5 space-y-4">
        <div>
          <label className="mb-1 block text-xs uppercase tracking-wide text-muted-foreground">From form</label>
          <select className="w-full rounded-md border border-border/60 bg-background px-3 py-2 text-sm" value={from} onChange={(e) => setFrom(e.target.value)}>
            <option value="">Select…</option>
            {(data?.forms ?? []).map((f) => <option key={f.id} value={f.id}>{f.name} ({f.count} students)</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs uppercase tracking-wide text-muted-foreground">To form</label>
          <select className="w-full rounded-md border border-border/60 bg-background px-3 py-2 text-sm" value={to} onChange={(e) => setTo(e.target.value)}>
            <option value="">Select…</option>
            {(data?.forms ?? []).filter((f) => f.id !== from).map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
        </div>
        <Button disabled={!from || !to || from === to || mut.isPending} onClick={() => mut.mutate()}>{mut.isPending ? "Promoting…" : "Promote all"}</Button>
        <p className="text-xs text-muted-foreground">This updates every student currently in the source form. Marks are preserved.</p>
      </div>
    </div>
  );
}
