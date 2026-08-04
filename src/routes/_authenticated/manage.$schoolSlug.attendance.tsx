import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CalendarCheck, Save } from "lucide-react";
import { toast } from "sonner";
import { getAttendanceDay, saveAttendance } from "@/lib/ops.functions";

export const Route = createFileRoute("/_authenticated/manage/$schoolSlug/attendance")({ component: Page });

const STATUSES = ["present", "absent", "late", "excused"] as const;
type Status = (typeof STATUSES)[number];

function Page() {
  const { schoolSlug } = Route.useParams();
  const qc = useQueryClient();
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [formId, setFormId] = useState<string>("");
  const [draft, setDraft] = useState<Record<string, Status>>({});

  const fetchDay = useServerFn(getAttendanceDay);
  const save = useServerFn(saveAttendance);
  const { data, isLoading } = useQuery({
    queryKey: ["attendance", schoolSlug, date, formId],
    queryFn: () => fetchDay({ data: { slug: schoolSlug, date, form_id: formId || null } }),
  });

  const mutation = useMutation({
    mutationFn: () =>
      save({
        data: {
          slug: schoolSlug,
          date,
          entries: (data?.rows ?? []).map((r) => ({ student_id: r.id, status: (draft[r.id] ?? (r.status as Status)) })),
        },
      }),
    onSuccess: (res) => {
      toast.success(`Saved attendance for ${res.count} students`);
      setDraft({});
      qc.invalidateQueries({ queryKey: ["attendance", schoolSlug] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rows = data?.rows ?? [];
  const statusOf = (id: string, fallback: string) => draft[id] ?? (fallback as Status);

  return (
    <div className="p-6 md:p-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <CalendarCheck className="h-5 w-5 text-muted-foreground" />
          <div>
            <h1 className="font-display text-2xl font-semibold">Attendance</h1>
            <p className="text-sm text-muted-foreground">Mark daily attendance per class.</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input type="date" value={date} onChange={(e) => { setDate(e.target.value); setDraft({}); }} className="h-9 rounded-lg border border-border bg-background px-3 text-sm" />
          <select value={formId} onChange={(e) => { setFormId(e.target.value); setDraft({}); }} className="h-9 rounded-lg border border-border bg-background px-3 text-sm">
            <option value="">All forms</option>
            {(data?.forms ?? []).map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
          <button onClick={() => mutation.mutate()} disabled={mutation.isPending || !rows.length} className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-50">
            <Save className="h-4 w-4" /> {mutation.isPending ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        {STATUSES.map((s) => (
          <div key={s} className="rounded-xl border border-border/60 bg-card p-4">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">{s}</div>
            <div className="mt-1 text-2xl font-semibold">{rows.filter((r) => statusOf(r.id, r.status) === s).length}</div>
          </div>
        ))}
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No students found for this selection.</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border/60">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr><th className="px-4 py-3">Adm no</th><th className="px-4 py-3">Student</th><th className="px-4 py-3">Status</th></tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-border/60">
                  <td className="px-4 py-2 font-mono text-xs">{r.admission_no}</td>
                  <td className="px-4 py-2">{r.full_name}</td>
                  <td className="px-4 py-2">
                    <div className="flex flex-wrap gap-1">
                      {STATUSES.map((s) => (
                        <button
                          key={s}
                          onClick={() => setDraft((d) => ({ ...d, [r.id]: s }))}
                          className={`rounded-md px-2 py-1 text-xs capitalize transition ${statusOf(r.id, r.status) === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"}`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
