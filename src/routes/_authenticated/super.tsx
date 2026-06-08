import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  Shield,
  ExternalLink,
  GraduationCap,
  LogOut,
  Search,
  Sparkles,
  Megaphone,
  ClipboardList,
  Users,
  CheckCircle2,
  PauseCircle,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import {
  getSuperOverview,
  setSchoolStatus,
  setSchoolPlan,
  getSchoolDetail,
  getRecentActivity,
} from "@/lib/super.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";

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
  const fetchActivity = useServerFn(getRecentActivity);
  const fetchDetail = useServerFn(getSchoolDetail);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | SchoolRow["status"]>("all");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [openSchoolId, setOpenSchoolId] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["super-overview"],
    queryFn: () => fetchOverview(),
    retry: false,
  });

  const { data: activity } = useQuery({
    queryKey: ["super-activity"],
    queryFn: () => fetchActivity(),
    retry: false,
    enabled: !error,
  });

  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: ["super-school-detail", openSchoolId],
    queryFn: () => fetchDetail({ data: { id: openSchoolId! } }),
    enabled: !!openSchoolId,
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

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return schools.filter((s) => {
      if (statusFilter !== "all" && s.status !== statusFilter) return false;
      if (planFilter !== "all" && s.plan !== planFilter) return false;
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        s.slug.toLowerCase().includes(q) ||
        (s.region ?? "").toLowerCase().includes(q)
      );
    });
  }, [schools, search, statusFilter, planFilter]);

  const newThisMonth = useMemo(() => {
    const now = new Date();
    const cutoff = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    return schools.filter((s) => new Date(s.created_at).getTime() >= cutoff).length;
  }, [schools]);

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
        <div className="grid gap-3 md:grid-cols-5">
          {[
            { label: "Schools", v: stats?.schools ?? 0 },
            { label: "New this month", v: newThisMonth },
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

        {/* Recent activity strip */}
        <div className="mt-6 grid gap-3 lg:grid-cols-3">
          <ActivityCard
            icon={<Sparkles className="h-4 w-4" />}
            title="New schools"
          >
            {(activity?.recentSchools ?? []).length === 0 && (
              <EmptyLine>No new schools yet.</EmptyLine>
            )}
            {(activity?.recentSchools ?? []).map((s) => (
              <ActivityRow
                key={s.id}
                title={s.name}
                subtitle={`/${s.slug}`}
                time={s.created_at}
              />
            ))}
          </ActivityCard>

          <ActivityCard
            icon={<ClipboardList className="h-4 w-4" />}
            title="Recent exams"
          >
            {(activity?.recentExams ?? []).length === 0 && (
              <EmptyLine>No exams yet.</EmptyLine>
            )}
            {(activity?.recentExams ?? []).map((e) => (
              <ActivityRow
                key={e.id}
                title={e.name}
                subtitle={e.school_name ?? "—"}
                time={e.created_at}
                badge={e.published ? "Published" : "Draft"}
              />
            ))}
          </ActivityCard>

          <ActivityCard
            icon={<Megaphone className="h-4 w-4" />}
            title="Latest announcements"
          >
            {(activity?.recentAnnouncements ?? []).length === 0 && (
              <EmptyLine>No announcements yet.</EmptyLine>
            )}
            {(activity?.recentAnnouncements ?? []).map((a) => (
              <ActivityRow
                key={a.id}
                title={a.title}
                subtitle={a.school_name ?? "—"}
                time={a.created_at}
              />
            ))}
          </ActivityCard>
        </div>

        <div className="mt-8 rounded-2xl border border-border/60 bg-card">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 px-5 py-4">
            <h2 className="font-display text-lg font-semibold">Schools</h2>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search name, slug, region"
                  className="h-9 w-56 pl-8"
                />
              </div>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
                <SelectTrigger className="h-9 w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
              <Select value={planFilter} onValueChange={setPlanFilter}>
                <SelectTrigger className="h-9 w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All plans</SelectItem>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="starter">Starter</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
              <div className="text-xs text-muted-foreground">
                {isLoading ? "Loading…" : `${filtered.length} / ${schools.length}`}
              </div>
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
                {filtered.map((s) => (
                  <tr
                    key={s.id}
                    className="cursor-pointer transition hover:bg-muted/40"
                    onClick={() => setOpenSchoolId(s.id)}
                  >
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
                    <td className="px-5 py-3" onClick={(e) => e.stopPropagation()}>
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
                    <td className="px-5 py-3" onClick={(e) => e.stopPropagation()}>
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
                    <td className="px-5 py-3 text-right" onClick={(e) => e.stopPropagation()}>
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
                {!isLoading && filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-10 text-center text-sm text-muted-foreground"
                    >
                      {schools.length === 0
                        ? "No schools yet."
                        : "No schools match your filters."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <Dialog open={!!openSchoolId} onOpenChange={(o) => !o && setOpenSchoolId(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-display">
              <GraduationCap className="h-5 w-5 text-muted-foreground" />
              {detail?.school.name ?? "School details"}
            </DialogTitle>
            <DialogDescription>
              {detail
                ? `/${detail.school.slug}${detail.school.region ? " · " + detail.school.region : ""}`
                : "Loading…"}
            </DialogDescription>
          </DialogHeader>

          {detailLoading || !detail ? (
            <div className="py-10 text-center text-sm text-muted-foreground">Loading…</div>
          ) : (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={detail.school.status as SchoolRow["status"]} />
                <Badge variant="secondary" className="capitalize">{detail.school.plan}</Badge>
                <span className="text-xs text-muted-foreground">
                  Created {new Date(detail.school.created_at).toLocaleDateString()}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <MiniStat label="Students" value={detail.stats.students} />
                <MiniStat label="Exams" value={detail.stats.exams} />
                <MiniStat label="Published" value={detail.stats.publishedExams} />
                <MiniStat label="Announcements" value={detail.stats.announcements} />
              </div>

              <div>
                <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
                  <Users className="h-3.5 w-3.5" /> Members ({detail.members.length})
                </div>
                <div className="overflow-hidden rounded-lg border border-border/60">
                  <table className="w-full text-sm">
                    <tbody className="divide-y divide-border/60">
                      {detail.members.length === 0 && (
                        <tr>
                          <td className="px-4 py-3 text-center text-muted-foreground" colSpan={2}>
                            No members yet.
                          </td>
                        </tr>
                      )}
                      {detail.members.map((m) => (
                        <tr key={m.user_id + m.role}>
                          <td className="px-4 py-2">
                            <div className="font-medium">{m.email ?? "(unknown email)"}</div>
                            <div className="font-mono text-[11px] text-muted-foreground">{m.user_id.slice(0, 8)}…</div>
                          </td>
                          <td className="px-4 py-2 text-right">
                            <Badge variant="outline" className="capitalize">{m.role.replace("_", " ")}</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end">
                <Button asChild variant="outline" size="sm">
                  <a href={`/${detail.school.slug}`} target="_blank" rel="noreferrer">
                    Open public portal <ExternalLink className="ml-2 h-3.5 w-3.5" />
                  </a>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ActivityCard({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card">
      <div className="flex items-center gap-2 border-b border-border/60 px-4 py-3 text-sm font-medium">
        <span className="text-muted-foreground">{icon}</span>
        {title}
      </div>
      <div className="divide-y divide-border/60">{children}</div>
    </div>
  );
}

function ActivityRow({
  title,
  subtitle,
  time,
  badge,
}: {
  title: string;
  subtitle?: string;
  time: string;
  badge?: string;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5 text-sm">
      <div className="min-w-0">
        <div className="truncate font-medium">{title}</div>
        {subtitle && (
          <div className="truncate text-xs text-muted-foreground">{subtitle}</div>
        )}
      </div>
      <div className="ml-3 flex items-center gap-2 text-[11px] text-muted-foreground">
        {badge && (
          <Badge variant="outline" className="text-[10px]">
            {badge}
          </Badge>
        )}
        {relativeTime(time)}
      </div>
    </div>
  );
}

function EmptyLine({ children }: { children: React.ReactNode }) {
  return <div className="px-4 py-6 text-center text-xs text-muted-foreground">{children}</div>;
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border/60 bg-background p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="font-display text-lg font-semibold tabular-nums">{value}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: SchoolRow["status"] }) {
  const map: Record<SchoolRow["status"], { label: string; icon: React.ReactNode; cls: string }> = {
    active: {
      label: "Active",
      icon: <CheckCircle2 className="h-3 w-3" />,
      cls: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
    },
    pending: {
      label: "Pending",
      icon: <Clock className="h-3 w-3" />,
      cls: "bg-amber-500/10 text-amber-600 border-amber-500/30",
    },
    suspended: {
      label: "Suspended",
      icon: <PauseCircle className="h-3 w-3" />,
      cls: "bg-rose-500/10 text-rose-600 border-rose-500/30",
    },
  };
  const v = map[status];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${v.cls}`}>
      {v.icon}
      {v.label}
    </span>
  );
}

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const diffSec = Math.max(1, Math.floor((Date.now() - then) / 1000));
  if (diffSec < 60) return `${diffSec}s ago`;
  const m = Math.floor(diffSec / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}