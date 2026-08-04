import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Clock, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { getTimetable, addTimetableSlot, deleteTimetableSlot } from "@/lib/ops.functions";

export const Route = createFileRoute("/_authenticated/manage/$schoolSlug/timetable")({ component: Page });

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function Page() {
  const { schoolSlug } = Route.useParams();
  const qc = useQueryClient();
  const [formId, setFormId] = useState("");
  const [f, setF] = useState({ form_id: "", subject_id: "", day_of_week: "1", start_time: "08:00", end_time: "09:00", teacher_name: "" });

  const fetchTt = useServerFn(getTimetable);
  const add = useServerFn(addTimetableSlot);
  const del = useServerFn(deleteTimetableSlot);
  const { data, isLoading } = useQuery({
    queryKey: ["timetable", schoolSlug, formId],
    queryFn: () => fetchTt({ data: { slug: schoolSlug, form_id: formId || null } }),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["timetable", schoolSlug] });
  const addM = useMutation({
    mutationFn: () => add({ data: { slug: schoolSlug, ...f, day_of_week: Number(f.day_of_week) } }),
    onSuccess: () => { toast.success("Slot added"); setF((p) => ({ ...p, subject_id: "" })); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });
  const delM = useMutation({
    mutationFn: (id: string) => del({ data: { slug: schoolSlug, id } }),
    onSuccess: () => { toast.success("Slot removed"); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const subjectName = (id: string | null) => (data?.subjects ?? []).find((s) => s.id === id)?.name ?? "—";
  const formName = (id: string | null) => (data?.forms ?? []).find((s) => s.id === id)?.name ?? "—";

  return (
    <div className="p-6 md:p-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Clock className="h-5 w-5 text-muted-foreground" />
          <div>
            <h1 className="font-display text-2xl font-semibold">Timetable</h1>
            <p className="text-sm text-muted-foreground">Weekly timetable per class and teacher.</p>
          </div>
        </div>
        <select value={formId} onChange={(e) => setFormId(e.target.value)} className="h-9 rounded-lg border border-border bg-background px-3 text-sm">
          <option value="">All forms</option>
          {(data?.forms ?? []).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
        </select>
      </div>

      <div className="mb-6 rounded-xl border border-border/60 bg-card p-4">
        <div className="mb-3 text-sm font-medium">Add a slot</div>
        <div className="grid gap-2 md:grid-cols-6">
          <select value={f.form_id} onChange={(e) => setF({ ...f, form_id: e.target.value })} className="h-9 rounded-lg border border-border bg-background px-2 text-sm">
            <option value="">Form…</option>
            {(data?.forms ?? []).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
          </select>
          <select value={f.subject_id} onChange={(e) => setF({ ...f, subject_id: e.target.value })} className="h-9 rounded-lg border border-border bg-background px-2 text-sm">
            <option value="">Subject…</option>
            {(data?.subjects ?? []).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
          </select>
          <select value={f.day_of_week} onChange={(e) => setF({ ...f, day_of_week: e.target.value })} className="h-9 rounded-lg border border-border bg-background px-2 text-sm">
            {DAYS.map((d, i) => <option key={d} value={i + 1}>{d}</option>)}
          </select>
          <input type="time" value={f.start_time} onChange={(e) => setF({ ...f, start_time: e.target.value })} className="h-9 rounded-lg border border-border bg-background px-2 text-sm" />
          <input type="time" value={f.end_time} onChange={(e) => setF({ ...f, end_time: e.target.value })} className="h-9 rounded-lg border border-border bg-background px-2 text-sm" />
          <input placeholder="Teacher (optional)" value={f.teacher_name} onChange={(e) => setF({ ...f, teacher_name: e.target.value })} className="h-9 rounded-lg border border-border bg-background px-2 text-sm" />
        </div>
        <button
          onClick={() => addM.mutate()}
          disabled={!f.form_id || !f.subject_id || addM.isPending}
          className="mt-3 inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          <Plus className="h-4 w-4" /> Add slot
        </button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {DAYS.map((day, i) => {
            const slots = (data?.slots ?? []).filter((s) => s.day_of_week === i + 1);
            return (
              <div key={day} className="rounded-xl border border-border/60 bg-card p-4">
                <div className="mb-2 text-sm font-semibold">{day}</div>
                {slots.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No lessons scheduled.</p>
                ) : (
                  <ul className="space-y-2">
                    {slots.map((s) => (
                      <li key={s.id} className="flex items-start justify-between gap-2 rounded-lg bg-muted/40 p-2">
                        <div>
                          <div className="text-sm font-medium">{subjectName(s.subject_id)}</div>
                          <div className="text-xs text-muted-foreground">
                            {String(s.start_time).slice(0, 5)}–{String(s.end_time).slice(0, 5)} · {formName(s.form_id)}
                            {s.teacher_name ? ` · ${s.teacher_name}` : ""}
                          </div>
                        </div>
                        <button onClick={() => delM.mutate(s.id)} className="text-muted-foreground hover:text-destructive" aria-label="Delete slot">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
