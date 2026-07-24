import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { BookUser } from "lucide-react";
import { listFormsAndSubjects } from "@/lib/manage.functions";

export const Route = createFileRoute("/_authenticated/manage/$schoolSlug/staff/subject-teachers")({ component: Page });

function Page() {
  const { schoolSlug } = Route.useParams();
  const fn = useServerFn(listFormsAndSubjects);
  const { data, isLoading } = useQuery({ queryKey: ["st-meta", schoolSlug], queryFn: () => fn({ data: { slug: schoolSlug } }) });

  return (
    <div className="p-6 md:p-10">
      <div className="mb-6 flex items-center gap-3">
        <BookUser className="h-5 w-5 text-muted-foreground" />
        <div>
          <h1 className="font-display text-2xl font-semibold">Subject teachers</h1>
          <p className="text-sm text-muted-foreground">Every subject taught in your school.</p>
        </div>
      </div>
      {isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : (
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
              <tr><th className="p-3">Subject</th><th>Code</th><th>Assigned teacher</th></tr>
            </thead>
            <tbody>
              {(data?.subjects ?? []).map((s) => (
                <tr key={s.id} className="border-t border-border/50">
                  <td className="p-3 font-medium">{s.name}</td>
                  <td className="font-mono text-xs text-muted-foreground">{s.code ?? "—"}</td>
                  <td><span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">Unassigned</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
