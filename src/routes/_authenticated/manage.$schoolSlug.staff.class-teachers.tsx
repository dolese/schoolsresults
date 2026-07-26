import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Users2 } from "lucide-react";
import { listClassesAndStreams } from "@/lib/academic.functions";

export const Route = createFileRoute("/_authenticated/manage/$schoolSlug/staff/class-teachers")({ component: Page });

function Page() {
  const { schoolSlug } = Route.useParams();
  const fn = useServerFn(listClassesAndStreams);
  const { data, isLoading } = useQuery({ queryKey: ["ct-forms", schoolSlug], queryFn: () => fn({ data: { slug: schoolSlug } }) });

  return (
    <div className="p-6 md:p-10">
      <div className="mb-6 flex items-center gap-3">
        <Users2 className="h-5 w-5 text-muted-foreground" />
        <div>
          <h1 className="font-display text-2xl font-semibold">Class teachers</h1>
          <p className="text-sm text-muted-foreground">Live roster of forms. Assign the class teacher in your school office register.</p>
        </div>
      </div>
      {isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : (
        <div className="grid gap-3 md:grid-cols-2">
          {(data?.forms ?? []).map((f) => (
            <div key={f.id} className="flex items-center justify-between rounded-2xl border border-border/60 bg-card p-5">
              <div>
                <div className="font-semibold">{f.name}</div>
                <div className="text-xs text-muted-foreground">{f.count} students · {(data?.streams ?? []).filter((s) => s.form_id === f.id).length} streams</div>
              </div>
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">Unassigned</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
