import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { GraduationCap, Plus, LogOut, ExternalLink, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getMySchools } from "@/lib/schools.functions";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/app")({
  head: () => ({ meta: [{ title: "Dashboard — SchoolsResultsPortal" }] }),
  component: AppDashboard,
});

function AppDashboard() {
  const navigate = useNavigate();
  const fetchMySchools = useServerFn(getMySchools);
  const { data, isLoading } = useQuery({ queryKey: ["my-schools"], queryFn: () => fetchMySchools() });
  const isSuper = (data ?? []).some((r: { role: string }) => r.role === "super_admin");

  async function logout() {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60 bg-card">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground"><GraduationCap className="h-5 w-5" /></span>
            <span className="font-display font-semibold">SchoolsResultsPortal</span>
          </Link>
          <Button variant="ghost" size="sm" onClick={logout}><LogOut className="mr-2 h-4 w-4" />Sign out</Button>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-10">
        {isSuper && (
          <div className="mb-6 flex items-center justify-between rounded-2xl border border-brand/40 bg-brand/5 px-5 py-4">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-brand" />
              <div>
                <div className="font-medium">Super admin access</div>
                <div className="text-xs text-muted-foreground">Manage all schools on the platform.</div>
              </div>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link to="/super">Open console</Link>
            </Button>
          </div>
        )}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-semibold">Your schools</h1>
            <p className="mt-1 text-muted-foreground">Manage portals you administer.</p>
          </div>
          <Button asChild className="bg-brand text-brand-foreground hover:bg-brand/90">
            <Link to="/signup"><Plus className="mr-2 h-4 w-4" /> New school</Link>
          </Button>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {isLoading && <p className="text-muted-foreground">Loading…</p>}
          {!isLoading && (data ?? []).length === 0 && (
            <div className="col-span-full rounded-2xl border border-dashed border-border/60 p-10 text-center">
              <p className="text-muted-foreground">You don't manage any schools yet.</p>
              <Button asChild className="mt-4 bg-brand text-brand-foreground hover:bg-brand/90">
                <Link to="/signup">Create your first school</Link>
              </Button>
            </div>
          )}
          {(data ?? []).map(({ school, role }: { school: { id: string; slug: string; name: string; status: string }; role: string }) => (
            <Link key={school.id} to="/manage/$schoolSlug" params={{ schoolSlug: school.slug }} className="rounded-2xl border border-border/60 bg-card p-6 transition hover:border-brand">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-display text-lg font-semibold">{school.name}</h3>
                  <p className="text-sm text-muted-foreground">/{school.slug}</p>
                </div>
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="mt-4 flex items-center gap-2 text-xs">
                <span className="rounded-full bg-secondary px-2 py-1">{role.replace("_", " ")}</span>
                <span className="rounded-full bg-success/15 px-2 py-1 text-success">{school.status}</span>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
