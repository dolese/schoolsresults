import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Trash2, Search, Pencil } from "lucide-react";
import {
  listStudents,
  upsertStudent,
  deleteStudent,
  listFormsAndSubjects,
} from "@/lib/manage.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { ImportStudentsDialog } from "@/components/manage/ImportStudentsDialog";

export const Route = createFileRoute("/_authenticated/manage/$schoolSlug/students")({
  head: () => ({ meta: [{ title: "Students — Dashboard" }] }),
  component: StudentsPage,
});

type Student = {
  id: string;
  admission_no: string;
  full_name: string;
  year: number;
  gender: string | null;
  form_id: string | null;
  forms: { name: string; level: number } | null;
};

function StudentsPage() {
  const { schoolSlug } = Route.useParams();
  const qc = useQueryClient();
  const fetchList = useServerFn(listStudents);
  const fetchMeta = useServerFn(listFormsAndSubjects);
  const upsertFn = useServerFn(upsertStudent);
  const deleteFn = useServerFn(deleteStudent);

  const [search, setSearch] = useState("");
  const [formFilter, setFormFilter] = useState<string>("all");
  const [editing, setEditing] = useState<Partial<Student> | null>(null);
  const [open, setOpen] = useState(false);

  const meta = useQuery({
    queryKey: ["meta", schoolSlug],
    queryFn: () => fetchMeta({ data: { slug: schoolSlug } }),
  });

  const list = useQuery({
    queryKey: ["students", schoolSlug, formFilter, search],
    queryFn: () =>
      fetchList({
        data: {
          slug: schoolSlug,
          formId: formFilter === "all" ? null : formFilter,
          search: search || null,
        },
      }),
  });

  const save = useMutation({
    mutationFn: (input: {
      id?: string;
      admission_no: string;
      full_name: string;
      form_id: string | null;
      year: number;
      gender: "M" | "F" | null;
    }) => upsertFn({ data: { slug: schoolSlug, ...input } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["students", schoolSlug] });
      qc.invalidateQueries({ queryKey: ["manage-overview", schoolSlug] });
      toast.success("Saved");
      setOpen(false);
      setEditing(null);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const del = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { slug: schoolSlug, id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["students", schoolSlug] });
      qc.invalidateQueries({ queryKey: ["manage-overview", schoolSlug] });
      toast.success("Deleted");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  function openNew() {
    setEditing({
      admission_no: "",
      full_name: "",
      form_id: meta.data?.forms[0]?.id ?? null,
      year: new Date().getFullYear(),
      gender: null,
    });
    setOpen(true);
  }

  function openEdit(s: Student) {
    setEditing(s);
    setOpen(true);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    save.mutate({
      id: editing.id,
      admission_no: editing.admission_no || "",
      full_name: editing.full_name || "",
      form_id: editing.form_id || null,
      year: editing.year || new Date().getFullYear(),
      gender: (editing.gender as "M" | "F" | null) || null,
    });
  }

  return (
    <div className="mx-auto max-w-6xl p-8">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold">Students</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage your school's student roster.</p>
        </div>
        <div className="flex items-center gap-2">
        <ImportStudentsDialog
          schoolSlug={schoolSlug}
          forms={meta.data?.forms ?? []}
        />
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew} className="bg-brand text-brand-foreground hover:bg-brand/90">
              <Plus className="mr-2 h-4 w-4" /> Add student
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing?.id ? "Edit student" : "New student"}</DialogTitle>
            </DialogHeader>
            {editing && (
              <form onSubmit={submit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Admission no.</Label>
                    <Input
                      required
                      value={editing.admission_no ?? ""}
                      onChange={(e) => setEditing({ ...editing, admission_no: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Year</Label>
                    <Input
                      type="number"
                      required
                      value={editing.year ?? ""}
                      onChange={(e) => setEditing({ ...editing, year: Number(e.target.value) })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Full name</Label>
                  <Input
                    required
                    value={editing.full_name ?? ""}
                    onChange={(e) => setEditing({ ...editing, full_name: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Form</Label>
                    <Select
                      value={editing.form_id ?? ""}
                      onValueChange={(v) => setEditing({ ...editing, form_id: v })}
                    >
                      <SelectTrigger><SelectValue placeholder="Select form" /></SelectTrigger>
                      <SelectContent>
                        {meta.data?.forms.map((f) => (
                          <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Gender</Label>
                    <Select
                      value={editing.gender ?? ""}
                      onValueChange={(v) => setEditing({ ...editing, gender: v as "M" | "F" })}
                    >
                      <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="M">Male</SelectItem>
                        <SelectItem value="F">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={save.isPending} className="bg-brand text-brand-foreground hover:bg-brand/90">
                    {save.isPending ? "Saving…" : "Save"}
                  </Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search admission no. or name"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={formFilter} onValueChange={setFormFilter}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All forms</SelectItem>
            {meta.data?.forms.map((f) => (
              <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-border/60 bg-card">
        <table className="w-full text-sm">
          <thead className="bg-secondary/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Adm. No.</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Form</th>
              <th className="px-4 py-3">Year</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {list.isLoading && (
              <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">Loading…</td></tr>
            )}
            {list.data && list.data.students.length === 0 && (
              <tr><td colSpan={5} className="p-10 text-center text-muted-foreground">No students yet.</td></tr>
            )}
            {(list.data?.students as Student[] | undefined)?.map((s) => (
              <tr key={s.id} className="hover:bg-accent/30">
                <td className="px-4 py-3 font-mono text-xs">{s.admission_no}</td>
                <td className="px-4 py-3 font-medium">{s.full_name}</td>
                <td className="px-4 py-3 text-muted-foreground">{s.forms?.name ?? "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">{s.year}</td>
                <td className="px-4 py-3 text-right">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(s)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (confirm(`Delete ${s.full_name}?`)) del.mutate(s.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}