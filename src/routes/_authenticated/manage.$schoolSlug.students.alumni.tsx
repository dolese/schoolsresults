import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { GraduationCap } from "lucide-react";
import { listAlumniStudents } from "@/lib/sims.functions";

export const Route = createFileRoute("/_authenticated/manage/$schoolSlug/students/alumni")({ component: Page });

function Page() {
  const { schoolSlug } = Route.useParams();
  const fn = useServerFn(listAlumniStudents);
  const { data, isLoading } = useQuery({ queryKey: ["alumni", schoolSlug], queryFn: () => fn({ data: { slug: schoolSlug } }) });

  return (
    <div className="p-6 md:p-10">
      <div className="mb-6 flex items-center gap-3">
        <GraduationCap className="h-5 w-5 text-muted-foreground" />
        <div>
          <h1 className="font-display text-2xl font-semibold">Alumni</h1>
          <p className="text-sm text-muted-foreground">Past students (enrolment year older than current year).</p>
        </div>
      </div>
      {isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : (
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
              <tr><th className="p-3">Adm.</th><th>Name</th><th>Form</th><th>Year</th><th className="p-3"></th></tr>
            </thead>
            <tbody>
              {(data?.alumni ?? []).map((s) => (
                <tr key={s.id} className="border-t border-border/50">
                  <td className="p-3 font-mono text-xs">{s.admission_no}</td>
                  <td className="font-medium">{s.full_name}</td>
                  <td>{(s.forms as { name: string } | null)?.name ?? "-"}</td>
                  <td>{s.year}</td>
                  <td className="p-3 text-right">
                    <Link to="/$schoolSlug/students/$studentId/history" params={{ schoolSlug, studentId: s.id }} className="text-primary hover:underline">History</Link>
                  </td>
                </tr>
              ))}
              {(data?.alumni ?? []).length === 0 && <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">No alumni recorded yet.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
