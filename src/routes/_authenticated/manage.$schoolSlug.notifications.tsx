import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { listRecentActivity } from "@/lib/dashboard.functions";

export const Route = createFileRoute("/_authenticated/manage/$schoolSlug/notifications")({ component: Page });

function Page() {
  const { schoolSlug } = Route.useParams();
  const fn = useServerFn(listRecentActivity);
  const { data, isLoading } = useQuery({ queryKey: ["notifs", schoolSlug], queryFn: () => fn({ data: { slug: schoolSlug } }) });

  return (
    <div className="p-6 md:p-10">
      <div className="mb-6 flex items-center gap-3">
        <Bell className="h-5 w-5 text-muted-foreground" />
        <div>
          <h1 className="font-display text-2xl font-semibold">Notifications</h1>
          <p className="text-sm text-muted-foreground">System notifications from your school workspace.</p>
        </div>
      </div>
      {isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : (
        <div className="space-y-2">
          {(data?.items ?? []).slice(0, 20).map((it) => (
            <div key={`${it.kind}-${it.id}`} className="rounded-xl border border-border/60 bg-card p-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">{it.title}</span>
                <span className="text-xs text-muted-foreground">{new Date(it.at).toLocaleString()}</span>
              </div>
              <div className="mt-1 text-xs text-muted-foreground capitalize">{it.kind.replace("-", " ")}</div>
            </div>
          ))}
          {(data?.items ?? []).length === 0 && <p className="text-sm text-muted-foreground">No notifications.</p>}
        </div>
      )}
    </div>
  );
}
