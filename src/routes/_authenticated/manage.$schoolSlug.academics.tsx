import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { BookOpen, Pencil, Plus, Trash2 } from "lucide-react";
import {
  deleteForm,
  deleteSubject,
  listAcademicStructure,
  upsertForm,
  upsertSubject,
} from "@/lib/school-admin.functions";
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
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/manage/$schoolSlug/academics")({
  head: () => ({ meta: [{ title: "Academics - School portal" }] }),
  component: AcademicsPage,
});

type FormRow = { id: string; name: string; level: number };
type SubjectRow = { id: string; name: string; code: string | null };

function AcademicsPage() {
  const { schoolSlug } = Route.useParams();
  const qc = useQueryClient();
  const fetchStructure = useServerFn(listAcademicStructure);
  const saveFormFn = useServerFn(upsertForm);
  const removeFormFn = useServerFn(deleteForm);
  const saveSubjectFn = useServerFn(upsertSubject);
  const removeSubjectFn = useServerFn(deleteSubject);

  const [formOpen, setFormOpen] = useState(false);
  const [subjectOpen, setSubjectOpen] = useState(false);
  const [editingForm, setEditingForm] = useState<Partial<FormRow> | null>(null);
  const [editingSubject, setEditingSubject] = useState<Partial<SubjectRow> | null>(null);

  const structure = useQuery({
    queryKey: ["academic-structure", schoolSlug],
    queryFn: () => fetchStructure({ data: { slug: schoolSlug } }),
  });

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: ["academic-structure", schoolSlug] });
    qc.invalidateQueries({ queryKey: ["meta", schoolSlug] });
    qc.invalidateQueries({ queryKey: ["manage-overview", schoolSlug] });
  };

  const saveForm = useMutation({
    mutationFn: (payload: { id?: string; name: string; level: number }) =>
      saveFormFn({ data: { slug: schoolSlug, ...payload } }),
    onSuccess: () => {
      toast.success("Form saved");
      setFormOpen(false);
      setEditingForm(null);
      invalidateAll();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to save form"),
  });

  const removeForm = useMutation({
    mutationFn: (id: string) => removeFormFn({ data: { slug: schoolSlug, id } }),
    onSuccess: () => {
      toast.success("Form deleted");
      invalidateAll();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to delete form"),
  });

  const saveSubject = useMutation({
    mutationFn: (payload: { id?: string; name: string; code: string | null }) =>
      saveSubjectFn({ data: { slug: schoolSlug, ...payload } }),
    onSuccess: () => {
      toast.success("Subject saved");
      setSubjectOpen(false);
      setEditingSubject(null);
      invalidateAll();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to save subject"),
  });

  const removeSubject = useMutation({
    mutationFn: (id: string) => removeSubjectFn({ data: { slug: schoolSlug, id } }),
    onSuccess: () => {
      toast.success("Subject deleted");
      invalidateAll();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to delete subject"),
  });

  function openNewForm() {
    setEditingForm({ name: "", level: (structure.data?.forms.length ?? 0) + 1 });
    setFormOpen(true);
  }

  function openExistingForm(form: FormRow) {
    setEditingForm(form);
    setFormOpen(true);
  }

  function openNewSubject() {
    setEditingSubject({ name: "", code: "" });
    setSubjectOpen(true);
  }

  function openExistingSubject(subject: SubjectRow) {
    setEditingSubject(subject);
    setSubjectOpen(true);
  }

  return (
    <div className="mx-auto max-w-6xl p-8">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold">Academics</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage forms and subjects for this school.
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-border/60 bg-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-xl font-semibold">Forms</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Class levels used for students and exams.
              </p>
            </div>
            <Dialog open={formOpen} onOpenChange={setFormOpen}>
              <DialogTrigger asChild>
                <Button onClick={openNewForm} className="bg-brand text-brand-foreground hover:bg-brand/90">
                  <Plus className="mr-2 h-4 w-4" /> Add form
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingForm?.id ? "Edit form" : "New form"}</DialogTitle>
                </DialogHeader>
                {editingForm && (
                  <form
                    className="space-y-4"
                    onSubmit={(e) => {
                      e.preventDefault();
                      saveForm.mutate({
                        id: editingForm.id,
                        name: editingForm.name?.trim() || "",
                        level: Number(editingForm.level ?? 1),
                      });
                    }}
                  >
                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input
                        value={editingForm.name ?? ""}
                        onChange={(e) => setEditingForm({ ...editingForm, name: e.target.value })}
                        placeholder="e.g. Form I"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Level</Label>
                      <Input
                        type="number"
                        min={1}
                        max={6}
                        value={editingForm.level ?? 1}
                        onChange={(e) =>
                          setEditingForm({ ...editingForm, level: Number(e.target.value) })
                        }
                      />
                    </div>
                    <DialogFooter>
                      <Button
                        type="submit"
                        disabled={saveForm.isPending || !editingForm.name?.trim()}
                        className="bg-brand text-brand-foreground hover:bg-brand/90"
                      >
                        {saveForm.isPending ? "Saving..." : "Save form"}
                      </Button>
                    </DialogFooter>
                  </form>
                )}
              </DialogContent>
            </Dialog>
          </div>

          <div className="mt-5 space-y-3">
            {structure.isLoading && <p className="text-sm text-muted-foreground">Loading...</p>}
            {(structure.data?.forms as FormRow[] | undefined)?.map((form) => (
              <div
                key={form.id}
                className="flex items-center justify-between rounded-xl border border-border/60 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-secondary">
                    <BookOpen className="h-4 w-4" />
                  </span>
                  <div>
                    <div className="font-medium">{form.name}</div>
                    <div className="text-xs text-muted-foreground">Level {form.level}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openExistingForm(form)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (confirm(`Delete ${form.name}?`)) removeForm.mutate(form.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
            {!structure.isLoading && (structure.data?.forms.length ?? 0) === 0 && (
              <div className="rounded-xl border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">
                No forms created yet.
              </div>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-border/60 bg-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-xl font-semibold">Subjects</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Subjects available when creating exams and entering marks.
              </p>
            </div>
            <Dialog open={subjectOpen} onOpenChange={setSubjectOpen}>
              <DialogTrigger asChild>
                <Button onClick={openNewSubject} className="bg-brand text-brand-foreground hover:bg-brand/90">
                  <Plus className="mr-2 h-4 w-4" /> Add subject
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingSubject?.id ? "Edit subject" : "New subject"}</DialogTitle>
                </DialogHeader>
                {editingSubject && (
                  <form
                    className="space-y-4"
                    onSubmit={(e) => {
                      e.preventDefault();
                      saveSubject.mutate({
                        id: editingSubject.id,
                        name: editingSubject.name?.trim() || "",
                        code: editingSubject.code?.trim() || null,
                      });
                    }}
                  >
                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input
                        value={editingSubject.name ?? ""}
                        onChange={(e) =>
                          setEditingSubject({ ...editingSubject, name: e.target.value })
                        }
                        placeholder="e.g. Mathematics"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Code</Label>
                      <Input
                        value={editingSubject.code ?? ""}
                        onChange={(e) =>
                          setEditingSubject({ ...editingSubject, code: e.target.value.toUpperCase() })
                        }
                        placeholder="e.g. MATH"
                      />
                    </div>
                    <DialogFooter>
                      <Button
                        type="submit"
                        disabled={saveSubject.isPending || !editingSubject.name?.trim()}
                        className="bg-brand text-brand-foreground hover:bg-brand/90"
                      >
                        {saveSubject.isPending ? "Saving..." : "Save subject"}
                      </Button>
                    </DialogFooter>
                  </form>
                )}
              </DialogContent>
            </Dialog>
          </div>

          <div className="mt-5 space-y-3">
            {structure.isLoading && <p className="text-sm text-muted-foreground">Loading...</p>}
            {(structure.data?.subjects as SubjectRow[] | undefined)?.map((subject) => (
              <div
                key={subject.id}
                className="flex items-center justify-between rounded-xl border border-border/60 px-4 py-3"
              >
                <div>
                  <div className="font-medium">{subject.name}</div>
                  <div className="text-xs text-muted-foreground">{subject.code ?? "No code"}</div>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openExistingSubject(subject)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (confirm(`Delete ${subject.name}?`)) removeSubject.mutate(subject.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
            {!structure.isLoading && (structure.data?.subjects.length ?? 0) === 0 && (
              <div className="rounded-xl border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">
                No subjects created yet.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
