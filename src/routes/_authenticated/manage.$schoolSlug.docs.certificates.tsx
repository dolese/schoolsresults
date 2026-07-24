import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Award } from "lucide-react";
import { listCertificateCandidates } from "@/lib/sims.functions";

export const Route = createFileRoute("/_authenticated/manage/$schoolSlug/docs/certificates")({ component: Page });

function Page() {
  const { schoolSlug } = Route.useParams();
  const fn = useServerFn(listCertificateCandidates);
  const { data, isLoading } = useQuery({ queryKey: ["certs", schoolSlug], queryFn: () => fn({ data: { slug: schoolSlug } }) });

  return (
    <div className="p-6 md:p-10">
      <div className="mb-6 flex items-center gap-3">
        <Award className="h-5 w-5 text-muted-foreground" />
        <div>
          <h1 className="font-display text-2xl font-semibold">Certificates</h1>
          <p className="text-sm text-muted-foreground">Form IV candidates and their division, based on published exams.</p>
        </div>
      </div>
      {isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : (
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
              <tr><th className="p-3">Adm.</th><th>Name</th><th>Subjects</th><th>Avg</th><th>Grade</th><th>Division</th><th className="p-3"></th></tr>
            </thead>
            <tbody>
              {(data?.candidates ?? []).map((c) => (
                <tr key={c.id} className="border-t border-border/50">
                  <td className="p-3 font-mono text-xs">{c.admission_no}</td>
                  <td className="font-medium">{c.full_name}</td>
                  <td>{c.subjects}</td>
                  <td>{c.avg.toFixed(1)}</td>
                  <td><span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-primary/10 px-2 text-xs font-semibold text-primary">{c.grade}</span></td>
                  <td className="font-semibold">{c.division}</td>
                  <td className="p-3 text-right">
                    <Link to="/$schoolSlug/results/$studentId" params={{ schoolSlug, studentId: c.id }} className="text-primary hover:underline">View slip</Link>
                  </td>
                </tr>
              ))}
              {(data?.candidates ?? []).length === 0 && <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">No Form IV candidates yet.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
