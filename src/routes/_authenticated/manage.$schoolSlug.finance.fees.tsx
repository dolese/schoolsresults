import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Wallet, Plus } from "lucide-react";
import { toast } from "sonner";
import { getFeeStatus, addFee, listStudentsBasic } from "@/lib/ops.functions";

export const Route = createFileRoute("/_authenticated/manage/$schoolSlug/finance/fees")({ component: Page });

const money = (n: number) => `TZS ${n.toLocaleString()}`;

function Page() {
  const { schoolSlug } = Route.useParams();
  const qc = useQueryClient();
  const [f, setF] = useState({ student_id: "", label: "Tuition", amount_due: "", due_date: "" });

  const fetchStatus = useServerFn(getFeeStatus);
  const fetchStudents = useServerFn(listStudentsBasic);
  const create = useServerFn(addFee);

  const { data, isLoading } = useQuery({ queryKey: ["fees", schoolSlug], queryFn: () => fetchStatus({ data: { slug: schoolSlug } }) });
  const { data: sd } = useQuery({ queryKey: ["students-basic", schoolSlug], queryFn: () => fetchStudents({ data: { slug: schoolSlug } }) });

  const addM = useMutation({
    mutationFn: () => create({ data: { slug: schoolSlug, student_id: f.student_id, label: f.label, amount_due: Number(f.amount_due || 0), due_date: f.due_date || null } }),
    onSuccess: () => { toast.success("Fee added"); setF({ ...f, student_id: "", amount_due: "" }); qc.invalidateQueries({ queryKey: ["fees", schoolSlug] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const rows = data?.rows ?? [];
  const totals = data?.totals ?? { due: 0, paid: 0 };

  return (
    <div className="p-6 md:p-10">
      <div className="mb-6 flex items-center gap-3">
        <Wallet className="h-5 w-5 text-muted-foreground" />
        <div>
          <h1 className="font-display text-2xl font-semibold">Fee status</h1>
          <p className="text-sm text-muted-foreground">Track invoiced fees and outstanding balances.</p>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Total billed" value={money(totals.due)} />
        <Stat label="Total collected" value={money(totals.paid)} />
        <Stat label="Outstanding" value={money(Math.max(totals.due - totals.paid, 0))} />
        <Stat label="Cleared students" value={`${data?.cleared ?? 0}`} />
      </div>

      <div className="mb-6 rounded-xl border border-border/60 bg-card p-4">
        <div className="mb-3 text-sm font-medium">Add a fee</div>
        <div className="grid gap-2 md:grid-cols-4">
          <select value={f.student_id} onChange={(e) => setF({ ...f, student_id: e.target.value })} className="h-9 rounded-lg border border-border bg-background px-2 text-sm">
            <option value="">Student…</option>
            {(sd?.students ?? []).map((s) => <option key={s.id} value={s.id}>{s.admission_no} · {s.full_name}</option>)}
          </select>
          <input placeholder="Label" value={f.label} onChange={(e) => setF({ ...f, label: e.target.value })} className="h-9 rounded-lg border border-border bg-background px-2 text-sm" />
          <input type="number" placeholder="Amount" value={f.amount_due} onChange={(e) => setF({ ...f, amount_due: e.target.value })} className="h-9 rounded-lg border border-border bg-background px-2 text-sm" />
          <input type="date" value={f.due_date} onChange={(e) => setF({ ...f, due_date: e.target.value })} className="h-9 rounded-lg border border-border bg-background px-2 text-sm" />
        </div>
        <button onClick={() => addM.mutate()} disabled={!f.student_id || !f.amount_due || addM.isPending} className="mt-3 inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-50">
          <Plus className="h-4 w-4" /> Add fee
        </button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No fees recorded yet.</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border/60">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr><th className="px-4 py-3">Adm no</th><th className="px-4 py-3">Student</th><th className="px-4 py-3">Form</th><th className="px-4 py-3 text-right">Billed</th><th className="px-4 py-3 text-right">Paid</th><th className="px-4 py-3 text-right">Balance</th></tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-border/60">
                  <td className="px-4 py-2 font-mono text-xs">{r.admission_no}</td>
                  <td className="px-4 py-2">{r.full_name}</td>
                  <td className="px-4 py-2 text-muted-foreground">{r.form}</td>
                  <td className="px-4 py-2 text-right">{money(r.due)}</td>
                  <td className="px-4 py-2 text-right">{money(r.paid)}</td>
                  <td className={`px-4 py-2 text-right font-medium ${r.balance > 0 ? "text-destructive" : "text-emerald-600"}`}>{money(r.balance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-4">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 text-xl font-semibold">{value}</div>
    </div>
  );
}
