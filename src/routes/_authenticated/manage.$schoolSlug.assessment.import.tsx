import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Upload, ArrowRight } from "lucide-react";
import { listExams } from "@/lib/manage.functions";

export const Route = createFileRoute("/_authenticated/manage/$schoolSlug/assessment/import")({ component: Page });

function Page() {
  const { schoolSlug } = Route.useParams();
  const fn = useServerFn(listExams);
  const { data, isLoading } = useQuery({ queryKey: ["import-exams", schoolSlug], queryFn: () => fn({ data: { slug: schoolSlug } }) });

  return (
    <div className="p-6 md:p-10">
      <div className="mb-6 flex items-center gap-3">
        <Upload className="h-5 w-5 text-muted-foreground" />
        <div>
          <h1 className="font-display text-2xl font-semibold">Bulk import marks</h1>
          <p className="text-sm text-muted-foreground">Open any exam and use the “Import XLSX” button in the marks grid.</p>
        </div>
      </div>
      <div className="mb-6 rounded-2xl border border-dashed border-border/60 bg-card/50 p-5 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">Format</p>
        <p className="mt-1">Row per student. First columns: <span className="font-mono">Admission No</span>, <span className="font-mono">Full Name</span>. One column per subject; header matches the subject name or code.</p>
      </div>
      {isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : (
        <div className="grid gap-3 md:grid-cols-2">
          {(data?.exams ?? []).map((e) => (
            <Link key={e.id} to="/manage/$schoolSlug/exams/$examId" params={{ schoolSlug, examId: e.id }} className="group flex items-center justify-between rounded-2xl border border-border/60 bg-card p-4 hover:border-primary/60">
              <div>
                <div className="font-medium">{e.name}</div>
                <div className="text-xs text-muted-foreground">{(e.forms as { name: string } | null)?.name ?? "-"} · {e.year}</div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
            </Link>
          ))}
          {(data?.exams ?? []).length === 0 && <p className="text-sm text-muted-foreground">Create an exam first.</p>}
        </div>
      )}
    </div>
  );
}
