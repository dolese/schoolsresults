import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { ShieldCheck } from "lucide-react";
import { listSchoolUsers } from "@/lib/dashboard.functions";

export const Route = createFileRoute("/_authenticated/manage/$schoolSlug/admin/roles")({ component: Page });

const ROLES: { role: string; label: string; scope: string; can: string[] }[] = [
  { role: "super_admin", label: "Super admin", scope: "Platform-wide", can: ["Approve schools", "Suspend accounts", "View all activity"] },
  { role: "school_admin", label: "School admin", scope: "This school", can: ["Manage students, exams and marks", "Publish results", "Invite teachers", "Configure grading"] },
  { role: "teacher", label: "Teacher", scope: "Assigned subjects", can: ["Enter marks", "View class rosters", "Print report cards"] },
];

function Page() {
  const { schoolSlug } = Route.useParams();
  const fn = useServerFn(listSchoolUsers);
  const { data } = useQuery({ queryKey: ["role-users", schoolSlug], queryFn: () => fn({ data: { slug: schoolSlug } }) });
  const users = data?.users ?? [];
  const counts = users.reduce<Record<string, number>>((acc, u) => ({ ...acc, [u.role]: (acc[u.role] ?? 0) + 1 }), {});

  return (
    <div className="p-6 md:p-10">
      <div className="mb-6 flex items-center gap-3">
        <ShieldCheck className="h-5 w-5 text-muted-foreground" />
        <div>
          <h1 className="font-display text-2xl font-semibold">Roles & permissions</h1>
          <p className="text-sm text-muted-foreground">Role definitions in this workspace. Assign roles from Users.</p>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {ROLES.map((r) => (
          <div key={r.role} className="rounded-2xl border border-border/60 bg-card p-5">
            <div className="flex items-center justify-between">
              <div className="font-semibold">{r.label}</div>
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">{counts[r.role] ?? 0} user{(counts[r.role] ?? 0) === 1 ? "" : "s"}</span>
            </div>
            <div className="mt-1 text-xs text-muted-foreground">{r.scope}</div>
            <ul className="mt-3 space-y-1.5 text-sm">
              {r.can.map((c) => (
                <li key={c} className="flex items-start gap-2 text-muted-foreground">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />{c}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
