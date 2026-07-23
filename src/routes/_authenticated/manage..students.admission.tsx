import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { UserPlus, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { listFormsAndSubjects, upsertStudent } from "@/lib/manage.functions";

export const Route = createFileRoute("/_authenticated/manage/$schoolSlug/students/admission")({ component: Page });

function Page() {
  const { schoolSlug } = Route.useParams();
  const navigate = useNavigate();
  const meta = useServerFn(listFormsAndSubjects);
  const save = useServerFn(upsertStudent);
  const { data } = useQuery({ queryKey: ["meta", schoolSlug], queryFn: () => meta({ data: { slug: schoolSlug } }) });
  const [form, setForm] = useState({ admission_no: "", full_name: "", form_id: "", year: new Date().getFullYear(), gender: "" as "" | "M" | "F" });
  const mut = useMutation({
    mutationFn: () => save({ data: { slug: schoolSlug, admission_no: form.admission_no, full_name: form.full_name, form_id: form.form_id || null, year: form.year, gender: form.gender || null } }),
    onSuccess: () => { toast.success("Student admitted"); setForm({ admission_no: "", full_name: "", form_id: form.form_id, year: form.year, gender: "" }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="p-6 md:p-10">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <UserPlus className="h-5 w-5 text-muted-foreground" />
          <div>
            <h1 className="font-display text-2xl font-semibold">New admission</h1>
            <p className="text-sm text-muted-foreground">Register a new student. For bulk upload use the roster page.</p>
          </div>
        </div>
        <Button asChild variant="outline" size="sm"><Link to="/_authenticated/manage/$schoolSlug/students" params={{ schoolSlug }}>Roster <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
      </div>
      <form onSubmit={(e) => { e.preventDefault(); mut.mutate(); }} className="max-w-xl space-y-4 rounded-2xl border border-border/60 bg-card p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div><Label>Admission number</Label><Input required value={form.admission_no} onChange={(e) => setForm({ ...form, admission_no: e.target.value })} /></div>
          <div><Label>Year</Label><Input type="number" value={form.year} onChange={(e) => setForm({ ...form, year: Number(e.target.value) })} /></div>
        </div>
        <div><Label>Full name</Label><Input required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Form</Label>
            <select className="w-full rounded-md border border-border/60 bg-background px-3 py-2 text-sm" value={form.form_id} onChange={(e) => setForm({ ...form, form_id: e.target.value })}>
              <option value="">Select…</option>
              {(data?.forms ?? []).map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </div>
          <div>
            <Label>Gender</Label>
            <select className="w-full rounded-md border border-border/60 bg-background px-3 py-2 text-sm" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value as "M" | "F" | "" })}>
              <option value="">Unspecified</option>
              <option value="M">Male</option>
              <option value="F">Female</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button type="submit" disabled={mut.isPending}>{mut.isPending ? "Admitting…" : "Admit student"}</Button>
        </div>
      </form>
    </div>
  );
}
