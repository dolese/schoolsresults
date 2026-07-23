import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Activity, ClipboardList, Megaphone, UserPlus, Send } from "lucide-react";
import { listRecentActivity } from "@/lib/dashboard.functions";

export const Route = createFileRoute("/_authenticated/manage/$schoolSlug/activity")({ component: Page });

const ICONS: Record<string, typeof Activity> = { exam: ClipboardList, "exam-published": Send, announcement: Megaphone, student: UserPlus };

function Page() {
  const { schoolSlug } = Route.useParams();
  const fn = useServerFn(listRecentActivity);
  const { data, isLoading } = useQuery({ queryKey: ["activity", schoolSlug], queryFn: () => fn({ data: { slug: schoolSlug } }) });

  return (
    <div className="p-6 md:p-10">
      <div className="mb-6 flex items-center gap-3">
        <Activity className="h-5 w-5 text-muted-foreground" />
        <div>
          <h1 className="font-display text-2xl font-semibold">Recent activity</h1>
          <p className="text-sm text-muted-foreground">Latest exams, announcements, and admissions.</p>
        </div>
      </div>
      {isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : (
        <div className="rounded-2xl border border-border/60 bg-card">
          <div className="divide-y divide-border/60">
            {(data?.items ?? []).map((it) => {
              const Icon = ICONS[it.kind] ?? Activity;
              return (
                <div key={`${it.kind}-${it.id}`} className="flex items-center gap-3 p-4">
                  <div className="grid h-9 w-9 place-items-center rounded-full bg-primary/10 text-primary"><Icon className="h-4 w-4" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="truncate font-medium">{it.title}</div>
                    <div className="text-xs text-muted-foreground capitalize">{it.kind.replace("-", " ")}</div>
                  </div>
                  <div className="text-xs text-muted-foreground">{new Date(it.at).toLocaleString()}</div>
                </div>
              );
            })}
            {(data?.items ?? []).length === 0 && <p className="p-6 text-sm text-muted-foreground">No activity yet.</p>}
          </div>
        </div>
      )}
    </div>
  );
}
