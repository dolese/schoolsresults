import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { UserRound } from "lucide-react";
import { listSchoolUsers } from "@/lib/dashboard.functions";

export const Route = createFileRoute("/_authenticated/manage/$schoolSlug/staff/teachers")({ component: Page });

function Page() {
  const { schoolSlug } = Route.useParams();
  const fn = useServerFn(listSchoolUsers);
  const { data, isLoading } = useQuery({ queryKey: ["teachers", schoolSlug], queryFn: () => fn({ data: { slug: schoolSlug } }) });
  const teachers = (data?.users ?? []).filter((u) => u.role === "teacher" || u.role === "school_admin");

  return (
    <div className="p-6 md:p-10">
      <div className="mb-6 flex items-center gap-3">
        <UserRound className="h-5 w-5 text-muted-foreground" />
        <div>
          <h1 className="font-display text-2xl font-semibold">Teachers</h1>
          <p className="text-sm text-muted-foreground">Staff with access to this school's dashboard.</p>
        </div>
      </div>
      {isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : (
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
              <tr><th className="p-3">Name</th><th>Email</th><th>Role</th><th>Joined</th></tr>
            </thead>
            <tbody>
              {teachers.map((t) => (
                <tr key={t.id} className="border-t border-border/50">
                  <td className="p-3 font-medium">{t.display_name ?? t.email?.split("@")[0] ?? "Staff"}</td>
                  <td className="text-muted-foreground">{t.email ?? "—"}</td>
                  <td><span className="inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">{t.role.replace("_", " ")}</span></td>
                  <td className="text-muted-foreground">{new Date(t.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
              {teachers.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">No teachers yet.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
