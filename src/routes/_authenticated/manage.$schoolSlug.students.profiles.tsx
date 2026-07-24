import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { IdCard } from "lucide-react";
import { listStudents } from "@/lib/manage.functions";

export const Route = createFileRoute("/_authenticated/manage/$schoolSlug/students/profiles")({ component: Page });

function Page() {
  const { schoolSlug } = Route.useParams();
  const fn = useServerFn(listStudents);
  const { data, isLoading } = useQuery({ queryKey: ["profiles", schoolSlug], queryFn: () => fn({ data: { slug: schoolSlug, formId: null, search: null } }) });

  return (
    <div className="p-6 md:p-10">
      <div className="mb-6 flex items-center gap-3">
        <IdCard className="h-5 w-5 text-muted-foreground" />
        <div>
          <h1 className="font-display text-2xl font-semibold">Student profiles</h1>
          <p className="text-sm text-muted-foreground">Every enrolled student — click through to their full history.</p>
        </div>
      </div>
      {isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {(data?.students ?? []).map((s) => (
            <Link key={s.id} to="/$schoolSlug/students/$studentId/history" params={{ schoolSlug, studentId: s.id }} className="group rounded-2xl border border-border/60 bg-card p-4 hover:border-primary/60">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                  {s.full_name.split(" ").map((n: string) => n[0]).slice(0, 2).join("")}
                </div>
                <div className="min-w-0">
                  <div className="truncate font-medium">{s.full_name}</div>
                  <div className="text-xs text-muted-foreground">{s.admission_no} · {(s.forms as { name: string } | null)?.name ?? "-"}</div>
                </div>
              </div>
            </Link>
          ))}
          {(data?.students ?? []).length === 0 && <p className="col-span-full text-sm text-muted-foreground">No students yet.</p>}
        </div>
      )}
    </div>
  );
}
