import { useState } from "react";
import * as XLSX from "xlsx";
import { Upload, FileSpreadsheet, Download } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { bulkImportStudents } from "@/lib/manage.functions";
import { toast } from "sonner";

type StudentRow = {
  admission_no: string;
  full_name: string;
  gender?: "M" | "F" | null;
  form_name?: string | null;
};

function normalizeHeader(h: string) {
  return h.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function parseStudentsSheet(file: File): Promise<StudentRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      try {
        const wb = XLSX.read(reader.result, { type: "array" });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
        const rows: StudentRow[] = [];
        for (const r of json) {
          const m: Record<string, unknown> = {};
          for (const [k, v] of Object.entries(r)) m[normalizeHeader(k)] = v;
          const admission = String(m.admissionno ?? m.admno ?? m.adm ?? m.admission ?? "").trim();
          const name = String(m.fullname ?? m.name ?? m.studentname ?? "").trim();
          if (!admission || !name) continue;
          const genderRaw = String(m.gender ?? m.sex ?? "").trim().toUpperCase();
          const gender =
            genderRaw === "M" || genderRaw === "MALE"
              ? "M"
              : genderRaw === "F" || genderRaw === "FEMALE"
                ? "F"
                : null;
          const form = String(m.form ?? m.formname ?? m.class ?? "").trim() || null;
          rows.push({ admission_no: admission, full_name: name, gender, form_name: form });
        }
        resolve(rows);
      } catch (e) {
        reject(e);
      }
    };
    reader.readAsArrayBuffer(file);
  });
}

function downloadTemplate() {
  const ws = XLSX.utils.aoa_to_sheet([
    ["Admission No", "Full Name", "Gender", "Form"],
    ["S001", "Jane Doe", "F", "Form I"],
    ["S002", "John Mwangi", "M", "Form I"],
  ]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Students");
  XLSX.writeFile(wb, "students-template.xlsx");
}

export function ImportStudentsDialog({
  schoolSlug,
  forms,
}: {
  schoolSlug: string;
  forms: { id: string; name: string }[];
}) {
  const qc = useQueryClient();
  const importFn = useServerFn(bulkImportStudents);
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<StudentRow[] | null>(null);
  const [filename, setFilename] = useState<string>("");
  const [defaultForm, setDefaultForm] = useState<string>("");
  const [year, setYear] = useState<number>(new Date().getFullYear());

  const mutation = useMutation({
    mutationFn: () =>
      importFn({
        data: {
          slug: schoolSlug,
          form_id: defaultForm || null,
          year,
          rows: rows ?? [],
        },
      }),
    onSuccess: (r) => {
      toast.success(`Imported ${r.count} students`);
      qc.invalidateQueries({ queryKey: ["students", schoolSlug] });
      qc.invalidateQueries({ queryKey: ["manage-overview", schoolSlug] });
      setOpen(false);
      setRows(null);
      setFilename("");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Import failed"),
  });

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFilename(f.name);
    try {
      const parsed = await parseStudentsSheet(f);
      if (!parsed.length) {
        toast.error("No valid rows found. Need Admission No + Full Name columns.");
        setRows(null);
        return;
      }
      setRows(parsed);
    } catch {
      toast.error("Could not read file");
      setRows(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="mr-2 h-4 w-4" /> Import XLSX
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import students from XLSX</DialogTitle>
          <DialogDescription>
            Columns: Admission No, Full Name, Gender (M/F), Form. Existing students with the same
            admission no + year are updated.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Button type="button" variant="ghost" size="sm" onClick={downloadTemplate}>
            <Download className="mr-2 h-4 w-4" /> Download template
          </Button>

          <div className="rounded-lg border border-dashed border-border/60 p-4 text-center">
            <FileSpreadsheet className="mx-auto h-8 w-8 text-muted-foreground" />
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={onFile}
              className="mt-3 block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-sm file:font-medium"
            />
            {filename && (
              <p className="mt-2 text-xs text-muted-foreground">
                {filename} — {rows?.length ?? 0} valid rows
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Default form (if blank in sheet)</Label>
              <Select value={defaultForm} onValueChange={setDefaultForm}>
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  {forms.map((f) => (
                    <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Year</Label>
              <Input
                type="number"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            disabled={!rows?.length || mutation.isPending}
            onClick={() => mutation.mutate()}
            className="bg-brand text-brand-foreground hover:bg-brand/90"
          >
            {mutation.isPending ? "Importing…" : `Import ${rows?.length ?? 0} students`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}