import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Trash2, FileSpreadsheet, BarChart3 } from "lucide-react";
import {
  listExams,
  createExam,
  setExamPublished,
  deleteExam,
  listFormsAndSubjects,
} from "@/lib/manage.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const EXAM_TYPES = [
  { v: "march", l: "March" },
  { v: "midterm", l: "Midterm" },
  { v: "mock", l: "Mock" },
  { v: "pre_necta", l: "Pre-NECTA" },
  { v: "terminal", l: "Terminal" },
  { v: "annual", l: "Annual" },
  { v: "september", l: "September" },
  { v: "pre_mock", l: "Pre-Mock" },
] as const;

export const Route = createFileRoute("/_authenticated/manage/$schoolSlug/exams")({
  head: () => ({ meta: [{ title: "Exams — Dashboard" }] }),
  component: ExamsPage,
});

function ExamsPage() {
  const { schoolSlug } = Route.useParams();
  const qc = useQueryClient();
  const fetchExams = useServerFn(listExams);
  const fetchMeta = useServerFn(listFormsAndSubjects);
  const createFn = useServerFn(createExam);
  const publishFn = useServerFn(setExamPublished);
  const delFn = useServerFn(deleteExam);

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<(typeof EXAM_TYPES)[number]["v"]>("mock");
  const [year, setYear] = useState(new Date().getFullYear());
  const [formId, setFormId] = useState<string>("");
  const [subjectIds, setSubjectIds] = useState<string[]>([]);

  const meta = useQuery({
    queryKey: ["meta", schoolSlug],
    queryFn: () => fetchMeta({ data: { slug: schoolSlug } }),
  });

  const exams = useQuery({
    queryKey: ["exams", schoolSlug],
    queryFn: () => fetchExams({ data: { slug: schoolSlug } }),
  });

  const create = useMutation({
    mutationFn: () =>
      createFn({
        data: { slug: schoolSlug, name, type, year, form_id: formId, subject_ids: subjectIds },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["exams", schoolSlug] });
      qc.invalidateQueries({ queryKey: ["manage-overview", schoolSlug] });
      toast.success("Exam created");
      setOpen(false);
      setName("");
      setSubjectIds([]);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const publish = useMutation({
    mutationFn: ({ id, published }: { id: string; published: boolean }) =>
      publishFn({ data: { slug: schoolSlug, id, published } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["exams", schoolSlug] });
      qc.invalidateQueries({ queryKey: ["manage-overview", schoolSlug] });
    },
  });

  const del = useMutation({
    mutationFn: (id: string) => delFn({ data: { slug: schoolSlug, id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["exams", schoolSlug] });
      qc.invalidateQueries({ queryKey: ["manage-overview", schoolSlug] });
      toast.success("Deleted");
    },
  });

  return (
    <div className="mx-auto max-w-6xl p-8">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold">Exams & Marks</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create exams, enter marks, then publish results to the public portal.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-brand text-brand-foreground hover:bg-brand/90">
              <Plus className="mr-2 h-4 w-4" /> New exam
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>New exam</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Mock Exam Term 2" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {EXAM_TYPES.map((t) => <SelectItem key={t.v} value={t.v}>{t.l}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Year</Label>
                  <Input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Form</Label>
                <Select value={formId} onValueChange={setFormId}>
                  <SelectTrigger><SelectValue placeholder="Select form" /></SelectTrigger>
                  <SelectContent>
                    {meta.data?.forms.map((f) => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Subjects</Label>
                <div className="grid max-h-44 grid-cols-2 gap-2 overflow-y-auto rounded-lg border border-border/60 p-3">
                  {meta.data?.subjects.map((s) => (
                    <label key={s.id} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={subjectIds.includes(s.id)}
                        onCheckedChange={(c) =>
                          setSubjectIds((prev) =>
                            c ? [...prev, s.id] : prev.filter((x) => x !== s.id),
                          )
                        }
                      />
                      {s.name}
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={() => create.mutate()}
                disabled={create.isPending || !name || !formId || subjectIds.length === 0}
                className="bg-brand text-brand-foreground hover:bg-brand/90"
              >
                {create.isPending ? "Creating…" : "Create exam"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mt-6 grid gap-3">
        {exams.isLoading && <p className="text-muted-foreground">Loading…</p>}
        {exams.data && exams.data.exams.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border/60 p-10 text-center text-muted-foreground">
            No exams yet. Click "New exam" to create one.
          </div>
        )}
        {exams.data?.exams.map((e) => {
          const form = (e.forms as { name: string } | null)?.name ?? "—";
          return (
            <div key={e.id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border/60 bg-card p-5">
              <div>
                <div className="font-display text-lg font-semibold">{e.name}</div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {form} · {e.type.replace("_", "-")} · {e.year}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-sm">
                  <Switch
                    checked={e.published}
                    onCheckedChange={(v) => publish.mutate({ id: e.id, published: v })}
                  />
                  <span className={e.published ? "text-success" : "text-muted-foreground"}>
                    {e.published ? "Published" : "Draft"}
                  </span>
                </div>
                <Button asChild size="sm" variant="outline">
                  <Link to="/manage/$schoolSlug/exams/$examId" params={{ schoolSlug, examId: e.id }}>
                    <FileSpreadsheet className="mr-2 h-4 w-4" /> Marks
                  </Link>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <Link
                    to="/manage/$schoolSlug/exams/$examId/analytics"
                    params={{ schoolSlug, examId: e.id }}
                  >
                    <BarChart3 className="mr-2 h-4 w-4" /> Analytics
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => { if (confirm(`Delete "${e.name}" and all its marks?`)) del.mutate(e.id); }}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}