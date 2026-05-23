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
import { bulkImportMarks } from "@/lib/manage.functions";
import { toast } from "sonner";

type MarkRow = { admission_no: string; scores: Record<string, number | null> };

function normalizeHeader(h: string) {
  return h.trim();
}

function parseMarksSheet(file: File): Promise<MarkRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      try {
        const wb = XLSX.read(reader.result, { type: "array" });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
        const rows: MarkRow[] = [];
        for (const r of json) {
          let admission = "";
          const scores: Record<string, number | null> = {};
          for (const [rawKey, v] of Object.entries(r)) {
            const key = normalizeHeader(rawKey);
            const norm = key.toLowerCase().replace(/[^a-z0-9]/g, "");
            if (
              norm === "admissionno" ||
              norm === "admno" ||
              norm === "adm" ||
              norm === "admission"
            ) {
              admission = String(v).trim();
              continue;
            }
            if (norm === "fullname" || norm === "name" || norm === "studentname") continue;
            if (v === "" || v === null || v === undefined) continue;
            const n = Number(v);
            if (Number.isNaN(n)) continue;
            scores[key] = Math.max(0, Math.min(100, n));
          }
          if (admission && Object.keys(scores).length) {
            rows.push({ admission_no: admission, scores });
          }
        }
        resolve(rows);
      } catch (e) {
        reject(e);
      }
    };
    reader.readAsArrayBuffer(file);
  });
}

function downloadTemplate(subjects: { name: string; code: string | null }[]) {
  const header = ["Admission No", "Full Name", ...subjects.map((s) => s.code ?? s.name)];
  const ws = XLSX.utils.aoa_to_sheet([header, ["S001", "Jane Doe", ...subjects.map(() => 75)]]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Marks");
  XLSX.writeFile(wb, "marks-template.xlsx");
}

export function ImportMarksDialog({
  schoolSlug,
  examId,
  subjects,
  onImported,
}: {
  schoolSlug: string;
  examId: string;
  subjects: { name: string; code: string | null }[];
  onImported?: () => void;
}) {
  const qc = useQueryClient();
  const importFn = useServerFn(bulkImportMarks);
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<MarkRow[] | null>(null);
  const [filename, setFilename] = useState("");

  const mutation = useMutation({
    mutationFn: () => importFn({ data: { slug: schoolSlug, examId, rows: rows ?? [] } }),
    onSuccess: (r) => {
      let msg = `Imported ${r.saved} marks`;
      if (r.unmatchedStudents.length) {
        msg += ` - skipped ${r.unmatchedStudents.length} unknown students`;
      }
      if (r.ambiguousStudents.length) {
        msg += ` - skipped ${r.ambiguousStudents.length} ambiguous students`;
      }
      if (r.unmatchedSubjects.length) {
        msg += ` - unknown subjects: ${r.unmatchedSubjects.join(", ")}`;
      }
      toast.success(msg);
      qc.invalidateQueries({ queryKey: ["marks-grid", schoolSlug, examId] });
      onImported?.();
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
      const parsed = await parseMarksSheet(f);
      if (!parsed.length) {
        toast.error("No valid rows found. Need Admission No + at least one subject column.");
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
          <DialogTitle>Import marks from XLSX</DialogTitle>
          <DialogDescription>
            First column: Admission No. Then one column per subject (use subject name or code).
            Existing marks are overwritten.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Button type="button" variant="ghost" size="sm" onClick={() => downloadTemplate(subjects)}>
            <Download className="mr-2 h-4 w-4" /> Download template for this exam
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
                {filename} - {rows?.length ?? 0} student rows
              </p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button
            disabled={!rows?.length || mutation.isPending}
            onClick={() => mutation.mutate()}
            className="bg-brand text-brand-foreground hover:bg-brand/90"
          >
            {mutation.isPending ? "Importing..." : `Import marks for ${rows?.length ?? 0} students`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
