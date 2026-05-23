import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Shield, ExternalLink, GraduationCap, LogOut } from "lucide-react";
import { toast } from "sonner";
import {
  getSuperOverview,
  setSchoolStatus,
  setSchoolPlan,
} from "@/lib/super.functions";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/super")({
  component: SuperAdminPage,
});

type SchoolRow = {
  id: string;
  slug: string;
  name: string;
  region: string | null;
  plan: string;
  status: "active" | "suspended" | "pending";
  created_at: string;
  student_count: number;
};

function SuperAdminPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const fetchOverview = useServerFn(getSuperOverview);
  const statusFn = useServerFn(setSchoolStatus);
  const planFn = useServerFn(setSchoolPlan);

  const { data, isLoading, error } = useQuery({
    queryKey: ["super-overview"],
    queryFn: () => fetchOverview(),
    retry: false,
  });

  const updateStatus = useMutation({
    mutationFn: (v: { id: string; status: SchoolRow["status"] }) =>
      statusFn({ data: v }),
    onSuccess: () => {
      toast.success("Status updated");
      qc.invalidateQueries({ queryKey: ["super-overview"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updatePlan = useMutation({
    mutationFn: (v: { id: string; plan: string }) =>
      planFn({ data: { id: v.id, plan: v.plan as "free" } }),
    onSuccess: () => {
      toast.success("Plan updated");
      qc.invalidateQueries({ queryKey: ["super-overview"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function logout() {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  }

  if (error) {
    return (
      <div className="grid min-h-screen place-items-center px-4 text-center">
        <div>
          <Shield className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <h1 className="font-display text-2xl font-semibold">Access denied</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            You need the super admin role to view this page.
          </p>
          <Button asChild className="mt-6">
            <Link to="/app">Back to app</Link>
          </Button>
        </div>
      </div>
    );
  }

  const stats = data?.stats;
  const schools = (data?.schools ?? []) as SchoolRow[];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60 bg-card">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground">
              <Shield className="h-5 w-5" />
            </span>
            <div>
              <div className="font-display font-semibold">Super Admin</div>
              <div className="text-xs text-muted-foreground">
                SchoolsResultsPortal
              </div>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={logout}>
            <LogOut className="mr-2 h-4 w-4" /> Sign out
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid gap-3 md:grid-cols-4">
          {[
            { label: "Schools", v: stats?.schools ?? 0 },
            { label: "Students", v: stats?.students ?? 0 },
            { label: "Exams", v: stats?.exams ?? 0 },
            { label: "Published exams", v: stats?.publishedExams ?? 0 },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-border/60 bg-card p-5"
            >
              <div className="text-xs uppercase tracking-wider text-muted-foreground">
                {s.label}
              </div>
              <div className="mt-1 font-display text-2xl font-semibold">
                {s.v}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border border-border/60 bg-card">
          <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
            <h2 className="font-display text-lg font-semibold">Schools</h2>
            <div className="text-xs text-muted-foreground">
              {isLoading ? "Loading…" : `${schools.length} total`}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border/60 bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-5 py-3">School</th>
                  <th className="px-5 py-3">Region</th>
                  <th className="px-5 py-3 text-right">Students</th>
                  <th className="px-5 py-3">Plan</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {schools.map((s) => (
                  <tr key={s.id}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span className="grid h-8 w-8 place-items-center rounded-lg bg-secondary">
                          <GraduationCap className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                          <div className="font-medium">{s.name}</div>
                          <div className="text-xs text-muted-foreground">
                            /{s.slug}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {s.region ?? "—"}
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums">
                      {s.student_count}
                    </td>
                    <td className="px-5 py-3">
                      <Select
                        value={s.plan}
                        onValueChange={(v) =>
                          updatePlan.mutate({ id: s.id, plan: v })
                        }
                      >
                        <SelectTrigger className="h-8 w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="free">Free</SelectItem>
                          <SelectItem value="starter">Starter</SelectItem>
                          <SelectItem value="pro">Pro</SelectItem>
                          <SelectItem value="enterprise">Enterprise</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-5 py-3">
                      <Select
                        value={s.status}
                        onValueChange={(v) =>
                          updateStatus.mutate({
                            id: s.id,
                            status: v as SchoolRow["status"],
                          })
                        }
                      >
                        <SelectTrigger className="h-8 w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="suspended">Suspended</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <a
                        href={`/${s.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                      >
                        Portal <ExternalLink className="h-3 w-3" />
                      </a>
                    </td>
                  </tr>
                ))}
                {!isLoading && schools.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-10 text-center text-sm text-muted-foreground"
                    >
                      No schools yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}