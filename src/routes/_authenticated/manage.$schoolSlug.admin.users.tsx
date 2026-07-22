import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Users, ShieldCheck, Mail } from "lucide-react";
import { listSchoolUsers } from "@/lib/dashboard.functions";

export const Route = createFileRoute("/_authenticated/manage/$schoolSlug/admin/users")({
  component: UsersPage,
});

function UsersPage() {
  const { schoolSlug } = Route.useParams();
  const fetchFn = useServerFn(listSchoolUsers);
  const { data, isLoading } = useQuery({
    queryKey: ["school-users", schoolSlug],
    queryFn: () => fetchFn({ data: { slug: schoolSlug } }),
  });

  return (
    <div className="p-6 md:p-10">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold flex items-center gap-2">
          <Users className="h-5 w-5" /> Users
        </h1>
        <p className="text-sm text-muted-foreground">People with access to this school.</p>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : !data || data.users.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/60 p-10 text-center">
          <p className="text-sm text-muted-foreground">No users assigned to this school.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border/60">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left">Name</th>
                <th className="px-3 py-2 text-left">Email</th>
                <th className="px-3 py-2 text-left">Role</th>
                <th className="px-3 py-2 text-left">Joined</th>
              </tr>
            </thead>
            <tbody>
              {data.users.map((u) => (
                <tr key={u.id} className="border-t border-border/60">
                  <td className="px-3 py-2 font-medium">{u.display_name ?? "—"}</td>
                  <td className="px-3 py-2 text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5" /> {u.email ?? u.user_id.slice(0, 8)}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      <ShieldCheck className="h-3 w-3" /> {u.role}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
