import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { getSubjectAnalysis, getClassPerformance, getGenderAnalysis } from "@/lib/academic.functions";

export const Route = createFileRoute("/_authenticated/manage/$schoolSlug/reports/custom")({ component: Page });

type Dim = "subject" | "class" | "gender";

function Page() {
  const { schoolSlug } = Route.useParams();
  const [dim, setDim] = useState<Dim>("subject");
  const [q, setQ] = useState("");

  const subj = useServerFn(getSubjectAnalysis);
  const cls = useServerFn(getClassPerformance);
  const gen = useServerFn(getGenderAnalysis);

  const subjQ = useQuery({ queryKey: ["custom-subj", schoolSlug], queryFn: () => subj({ data: { slug: schoolSlug } }), enabled: dim === "subject" });
  const clsQ = useQuery({ queryKey: ["custom-cls", schoolSlug], queryFn: () => cls({ data: { slug: schoolSlug } }), enabled: dim === "class" });
  const genQ = useQuery({ queryKey: ["custom-gen", schoolSlug], queryFn: () => gen({ data: { slug: schoolSlug } }), enabled: dim === "gender" });

  const rows = useMemo(() => {
    if (dim === "subject") return (subjQ.data?.rows ?? []).map((r) => ({ label: r.name, entries: r.entries, avg: r.avg, extra: `${r.passRate.toFixed(0)}% pass` }));
    if (dim === "class") return (clsQ.data?.rows ?? []).map((r) => ({ label: r.name, entries: r.entries, avg: r.avg, extra: `${r.students} students` }));
    return (genQ.data?.rows ?? []).map((r) => ({ label: r.gender, entries: r.entries, avg: r.avg, extra: `${r.students} students` }));
  }, [dim, subjQ.data, clsQ.data, genQ.data]);

  const filtered = q ? rows.filter((r) => r.label.toLowerCase().includes(q.toLowerCase())) : rows;

  return (
    <div className="p-6 md:p-10">
      <div className="mb-6 flex items-center gap-3">
        <SlidersHorizontal className="h-5 w-5 text-muted-foreground" />
        <div>
          <h1 className="font-display text-2xl font-semibold">Custom reports</h1>
          <p className="text-sm text-muted-foreground">Slice performance by subject, class or gender. Filter by name.</p>
        </div>
      </div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {(["subject", "class", "gender"] as Dim[]).map((d) => (
          <button key={d} onClick={() => setDim(d)} className={`rounded-full px-3 py-1.5 text-xs font-medium capitalize transition ${dim === d ? "bg-primary text-primary-foreground" : "border border-border/60 bg-card text-muted-foreground hover:text-foreground"}`}>{d}</button>
        ))}
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter…" className="ml-auto h-9 rounded-md border border-border/60 bg-background px-3 text-sm outline-none focus:border-primary" />
      </div>
      <div className="overflow-hidden rounded-2xl border border-border/60 bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
            <tr><th className="p-3 text-left">Group</th><th className="p-3 text-right">Entries</th><th className="p-3 text-right">Average</th><th className="p-3 text-right">Detail</th></tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.label} className="border-t border-border/50">
                <td className="p-3 font-medium">{r.label}</td>
                <td className="p-3 text-right font-mono">{r.entries}</td>
                <td className="p-3 text-right font-mono">{r.avg.toFixed(1)}</td>
                <td className="p-3 text-right text-muted-foreground">{r.extra}</td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">No data.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
