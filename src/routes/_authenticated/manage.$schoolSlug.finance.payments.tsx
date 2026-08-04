import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Receipt, Plus } from "lucide-react";
import { toast } from "sonner";
import { listPayments, recordPayment, listStudentsBasic } from "@/lib/ops.functions";

export const Route = createFileRoute("/_authenticated/manage/$schoolSlug/finance/payments")({ component: Page });

const money = (n: number) => `TZS ${Number(n).toLocaleString()}`;

function Page() {
  const { schoolSlug } = Route.useParams();
  const qc = useQueryClient();
  const [f, setF] = useState<{ student_id: string; amount: string; method: "cash" | "bank" | "mobile"; reference: string }>({
    student_id: "", amount: "", method: "cash", reference: "",
  });

  const fetchPayments = useServerFn(listPayments);
  const fetchStudents = useServerFn(listStudentsBasic);
  const create = useServerFn(recordPayment);

  const { data, isLoading } = useQuery({ queryKey: ["payments", schoolSlug], queryFn: () => fetchPayments({ data: { slug: schoolSlug } }) });
  const { data: sd } = useQuery({ queryKey: ["students-basic", schoolSlug], queryFn: () => fetchStudents({ data: { slug: schoolSlug } }) });

  const addM = useMutation({
    mutationFn: () => create({ data: { slug: schoolSlug, student_id: f.student_id, amount: Number(f.amount || 0), method: f.method, reference: f.reference || null } }),
    onSuccess: () => { toast.success("Payment recorded"); setF({ ...f, student_id: "", amount: "", reference: "" }); qc.invalidateQueries({ queryKey: ["payments", schoolSlug] }); qc.invalidateQueries({ queryKey: ["fees", schoolSlug] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const rows = data?.rows ?? [];

  return (
    <div className="p-6 md:p-10">
      <div className="mb-6 flex items-center gap-3">
        <Receipt className="h-5 w-5 text-muted-foreground" />
        <div>
          <h1 className="font-display text-2xl font-semibold">Payment history</h1>
          <p className="text-sm text-muted-foreground">All fee payments received, most recent first.</p>
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-border/60 bg-card p-4">
        <div className="mb-3 text-sm font-medium">Record a payment · collected {money(data?.total ?? 0)}</div>
        <div className="grid gap-2 md:grid-cols-4">
          <select value={f.student_id} onChange={(e) => setF({ ...f, student_id: e.target.value })} className="h-9 rounded-lg border border-border bg-background px-2 text-sm">
            <option value="">Student…</option>
            {(sd?.students ?? []).map((s) => <option key={s.id} value={s.id}>{s.admission_no} · {s.full_name}</option>)}
          </select>
          <input type="number" placeholder="Amount" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} className="h-9 rounded-lg border border-border bg-background px-2 text-sm" />
          <select value={f.method} onChange={(e) => setF({ ...f, method: e.target.value as "cash" | "bank" | "mobile" })} className="h-9 rounded-lg border border-border bg-background px-2 text-sm">
            <option value="cash">Cash</option>
            <option value="bank">Bank</option>
            <option value="mobile">Mobile money</option>
          </select>
          <input placeholder="Reference (optional)" value={f.reference} onChange={(e) => setF({ ...f, reference: e.target.value })} className="h-9 rounded-lg border border-border bg-background px-2 text-sm" />
        </div>
        <button onClick={() => addM.mutate()} disabled={!f.student_id || !f.amount || addM.isPending} className="mt-3 inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-50">
          <Plus className="h-4 w-4" /> Record payment
        </button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No payments recorded yet.</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border/60">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr><th className="px-4 py-3">Date</th><th className="px-4 py-3">Student</th><th className="px-4 py-3">Method</th><th className="px-4 py-3">Reference</th><th className="px-4 py-3 text-right">Amount</th></tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-border/60">
                  <td className="px-4 py-2 text-muted-foreground">{new Date(r.paid_at).toLocaleDateString()}</td>
                  <td className="px-4 py-2">{r.students?.full_name ?? "—"} <span className="font-mono text-xs text-muted-foreground">{r.students?.admission_no ?? ""}</span></td>
                  <td className="px-4 py-2 capitalize">{r.method}</td>
                  <td className="px-4 py-2 text-muted-foreground">{r.reference ?? "—"}</td>
                  <td className="px-4 py-2 text-right font-medium">{money(r.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
