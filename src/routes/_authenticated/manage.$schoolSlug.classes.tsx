import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Layers, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { listClassesAndStreams, addStream, deleteStream } from "@/lib/academic.functions";

export const Route = createFileRoute("/_authenticated/manage/$schoolSlug/classes")({ component: Page });

function Page() {
  const { schoolSlug } = Route.useParams();
  const qc = useQueryClient();
  const list = useServerFn(listClassesAndStreams);
  const add = useServerFn(addStream);
  const del = useServerFn(deleteStream);
  const key = ["classes", schoolSlug];
  const { data, isLoading } = useQuery({ queryKey: key, queryFn: () => list({ data: { slug: schoolSlug } }) });
  const invalidate = () => qc.invalidateQueries({ queryKey: key });
  const [nameByForm, setNameByForm] = useState<Record<string, string>>({});
  const addMut = useMutation({ mutationFn: (v: { form_id: string; name: string }) => add({ data: { slug: schoolSlug, ...v } }), onSuccess: () => { toast.success("Stream added"); invalidate(); }, onError: (e: Error) => toast.error(e.message) });
  const delMut = useMutation({ mutationFn: (id: string) => del({ data: { slug: schoolSlug, id } }), onSuccess: () => { toast.success("Stream removed"); invalidate(); }, onError: (e: Error) => toast.error(e.message) });

  return (
    <div className="p-6 md:p-10">
      <div className="mb-6 flex items-center gap-3">
        <Layers className="h-5 w-5 text-muted-foreground" />
        <div>
          <h1 className="font-display text-2xl font-semibold">Classes &amp; streams</h1>
          <p className="text-sm text-muted-foreground">Group each form into streams (e.g. Form 4A, Form 4B).</p>
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {(data?.forms ?? []).map((f) => {
            const streams = (data?.streams ?? []).filter((s) => s.form_id === f.id);
            return (
              <div key={f.id} className="rounded-2xl border border-border/60 bg-card p-5">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h2 className="font-display text-lg font-semibold">{f.name}</h2>
                    <p className="text-xs text-muted-foreground flex items-center gap-1"><Users className="h-3 w-3" /> {f.count} students</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {streams.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No streams yet.</p>
                  ) : streams.map((s) => (
                    <div key={s.id} className="flex items-center justify-between rounded-lg border border-border/50 px-3 py-2">
                      <div>
                        <span className="font-medium">{s.name}</span>
                        <span className="ml-2 text-xs text-muted-foreground">{s.count} students</span>
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => delMut.mutate(s.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex gap-2">
                  <Input placeholder="Stream name e.g. A" value={nameByForm[f.id] ?? ""} onChange={(e) => setNameByForm((p) => ({ ...p, [f.id]: e.target.value }))} />
                  <Button onClick={() => { const n = (nameByForm[f.id] ?? "").trim(); if (!n) return; addMut.mutate({ form_id: f.id, name: n }); setNameByForm((p) => ({ ...p, [f.id]: "" })); }}>Add</Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
