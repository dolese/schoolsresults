import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Save } from "lucide-react";
import { getExamMarksGrid, saveMarksBulk } from "@/lib/manage.functions";
import { gradeFor, computeDivision } from "@/lib/grading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ImportMarksDialog } from "@/components/manage/ImportMarksDialog";

export const Route = createFileRoute("/_authenticated/manage/$schoolSlug/exams/$examId")({
  head: () => ({ meta: [{ title: "Marks entry — Dashboard" }] }),
  component: MarksEntry,
});

type Cell = number | null;

function MarksEntry() {
  const { schoolSlug, examId } = Route.useParams();
  const qc = useQueryClient();
  const fetchGrid = useServerFn(getExamMarksGrid);
  const saveFn = useServerFn(saveMarksBulk);

  const grid = useQuery({
    queryKey: ["marks-grid", schoolSlug, examId],
    queryFn: () => fetchGrid({ data: { slug: schoolSlug, examId } }),
  });

  const [draft, setDraft] = useState<Record<string, Record<string, Cell>>>({});
  const [dirty, setDirty] = useState(false);

  // Hydrate when grid arrives
  useEffect(() => {
    if (!grid.data) return;
    const map: Record<string, Record<string, Cell>> = {};
    for (const s of grid.data.students) map[s.id] = {};
    for (const m of grid.data.marks) {
      if (!map[m.student_id]) map[m.student_id] = {};
      map[m.student_id][m.subject_id] = m.score;
    }
    setDraft(map);
    setDirty(false);
  }, [grid.data]);

  const save = useMutation({
    mutationFn: () => {
      if (!grid.data) return Promise.resolve({ saved: 0, cleared: 0 });
      const entries: { student_id: string; subject_id: string; score: number | null }[] = [];
      for (const s of grid.data.students) {
        for (const sub of grid.data.subjects) {
          const v = draft[s.id]?.[sub.id];
          entries.push({ student_id: s.id, subject_id: sub.id, score: v ?? null });
        }
      }
      return saveFn({ data: { slug: schoolSlug, examId, entries } });
    },
    onSuccess: (r) => {
      toast.success(`Saved ${r.saved} marks`);
      setDirty(false);
      qc.invalidateQueries({ queryKey: ["marks-grid", schoolSlug, examId] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  function setCell(studentId: string, subjectId: string, raw: string) {
    let val: Cell = null;
    if (raw.trim() !== "") {
      const n = Number(raw);
      if (Number.isNaN(n)) return;
      val = Math.max(0, Math.min(100, n));
    }
    setDraft((prev) => ({
      ...prev,
      [studentId]: { ...(prev[studentId] ?? {}), [subjectId]: val },
    }));
    setDirty(true);
  }

  const summary = useMemo(() => {
    if (!grid.data) return null;
    return grid.data.students.map((s) => {
      const scores: number[] = [];
      for (const sub of grid.data!.subjects) {
        const v = draft[s.id]?.[sub.id];
        if (typeof v === "number") scores.push(v);
      }
      const total = scores.reduce((a, b) => a + b, 0);
      const avg = scores.length ? total / scores.length : 0;
      const div = scores.length >= 4 ? computeDivision(scores) : null;
      return { id: s.id, total, avg, division: div?.division ?? "—" };
    });
  }, [grid.data, draft]);

  if (grid.isLoading) return <div className="p-10 text-muted-foreground">Loading…</div>;
  if (!grid.data) return <div className="p-10 text-muted-foreground">No data.</div>;

  const { exam, students, subjects } = grid.data;

  return (
    <div className="mx-auto max-w-[1200px] p-6">
      <div className="flex items-end justify-between">
        <div>
          <Button asChild variant="ghost" size="sm" className="mb-2">
            <Link to="/manage/$schoolSlug/exams" params={{ schoolSlug }}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to exams
            </Link>
          </Button>
          <h1 className="font-display text-2xl font-semibold">{exam.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {(exam.forms as { name: string } | null)?.name ?? "—"} · {exam.type.replace("_", "-")} · {exam.year} · {students.length} students · {subjects.length} subjects
          </p>
        </div>
        <div className="flex items-center gap-2">
        <ImportMarksDialog
          schoolSlug={schoolSlug}
          examId={examId}
          subjects={grid.data.subjects.map((s) => ({ name: s.name, code: s.code }))}
        />
        <Button
          onClick={() => save.mutate()}
          disabled={!dirty || save.isPending}
          className="bg-brand text-brand-foreground hover:bg-brand/90"
        >
          <Save className="mr-2 h-4 w-4" /> {save.isPending ? "Saving…" : dirty ? "Save changes" : "Saved"}
        </Button>
        </div>
      </div>

      {students.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-border/60 p-10 text-center text-muted-foreground">
          No students enrolled in this form yet. Add some under{" "}
          <Link to="/manage/$schoolSlug/students" params={{ schoolSlug }} className="text-brand hover:underline">Students</Link>.
        </div>
      ) : subjects.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-border/60 p-10 text-center text-muted-foreground">
          No subjects on this exam.
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-border/60 bg-card">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="sticky left-0 z-10 bg-secondary/50 px-4 py-3">Student</th>
                {subjects.map((s) => (
                  <th key={s.id} className="px-2 py-3 text-center" title={s.name}>
                    {s.code ?? s.name.slice(0, 4).toUpperCase()}
                  </th>
                ))}
                <th className="px-3 py-3 text-right">Total</th>
                <th className="px-3 py-3 text-right">Avg</th>
                <th className="px-3 py-3 text-right">Div</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {students.map((s, idx) => {
                const sum = summary?.[idx];
                return (
                  <tr key={s.id} className="hover:bg-accent/20">
                    <td className="sticky left-0 bg-card px-4 py-2">
                      <div className="font-medium">{s.full_name}</div>
                      <div className="font-mono text-xs text-muted-foreground">{s.admission_no}</div>
                    </td>
                    {subjects.map((sub) => {
                      const v = draft[s.id]?.[sub.id];
                      const grade = typeof v === "number" ? gradeFor(v).grade : null;
                      return (
                        <td key={sub.id} className="px-1 py-1.5 text-center">
                          <div className="relative inline-block">
                            <Input
                              type="number"
                              min={0}
                              max={100}
                              value={v ?? ""}
                              onChange={(e) => setCell(s.id, sub.id, e.target.value)}
                              className="h-9 w-16 text-center"
                            />
                            {grade && (
                              <span className="pointer-events-none absolute -right-1 -top-1 rounded bg-secondary px-1 text-[10px] font-semibold">
                                {grade}
                              </span>
                            )}
                          </div>
                        </td>
                      );
                    })}
                    <td className="px-3 py-2 text-right font-medium">{sum?.total.toFixed(0)}</td>
                    <td className="px-3 py-2 text-right text-muted-foreground">{sum?.avg.toFixed(1)}</td>
                    <td className="px-3 py-2 text-right">
                      <span className="rounded-md bg-secondary px-2 py-0.5 font-semibold text-brand">
                        {sum?.division}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-4 text-xs text-muted-foreground">
        Tip: Marks save when you click "Save changes". Empty cells are treated as no mark recorded.
      </p>
    </div>
  );
}