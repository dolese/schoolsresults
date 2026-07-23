import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { listExams, setExamPublished } from "@/lib/manage.functions";

export const Route = createFileRoute("/_authenticated/manage/$schoolSlug/assessment/publish")({ component: Page });

function Page() {
  const { schoolSlug } = Route.useParams();
  const qc = useQueryClient();
  const list = useServerFn(listExams);
  const setPub = useServerFn(setExamPublished);
  const key = ["publish-exams", schoolSlug];
  const { data, isLoading } = useQuery({ queryKey: key, queryFn: () => list({ data: { slug: schoolSlug } }) });
  const mut = useMutation({
    mutationFn: (v: { id: string; published: boolean }) => setPub({ data: { slug: schoolSlug, ...v } }),
    onSuccess: (_r, v) => { toast.success(v.published ? "Published" : "Unpublished"); qc.invalidateQueries({ queryKey: key }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="p-6 md:p-10">
      <div className="mb-6 flex items-center gap-3">
        <Send className="h-5 w-5 text-muted-foreground" />
        <div>
          <h1 className="font-display text-2xl font-semibold">Publish results</h1>
          <p className="text-sm text-muted-foreground">Control which exams are visible on the public portal.</p>
        </div>
      </div>
      {isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : (
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
              <tr><th className="p-3">Exam</th><th>Form</th><th>Year</th><th>Status</th><th className="text-right p-3">Action</th></tr>
            </thead>
            <tbody>
              {(data?.exams ?? []).map((e) => (
                <tr key={e.id} className="border-t border-border/50">
                  <td className="p-3 font-medium">{e.name}</td>
                  <td>{(e.forms as { name: string } | null)?.name ?? "-"}</td>
                  <td>{e.year}</td>
                  <td>{e.published ? <span className="inline-flex rounded-full bg-green-500/15 px-2 py-0.5 text-xs font-medium text-green-600">Published</span> : <span className="inline-flex rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">Draft</span>}</td>
                  <td className="p-3 text-right">
                    <Button size="sm" variant={e.published ? "outline" : "default"} disabled={mut.isPending} onClick={() => mut.mutate({ id: e.id, published: !e.published })}>
                      {e.published ? "Unpublish" : "Publish"}
                    </Button>
                  </td>
                </tr>
              ))}
              {(data?.exams ?? []).length === 0 && <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">No exams yet.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
