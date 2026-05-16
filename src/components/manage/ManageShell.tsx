import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { LayoutDashboard, Users, ClipboardList, ExternalLink, LogOut, GraduationCap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ManageShell({
  schoolSlug,
  schoolName,
  children,
}: {
  schoolSlug: string;
  schoolName: string;
  children: React.ReactNode;
}) {
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });

  const items = [
    { to: `/manage/${schoolSlug}`, label: "Overview", icon: LayoutDashboard, exact: true },
    { to: `/manage/${schoolSlug}/students`, label: "Students", icon: Users },
    { to: `/manage/${schoolSlug}/exams`, label: "Exams & Marks", icon: ClipboardList },
  ];

  async function logout() {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  }

  return (
    <div className="grid min-h-screen bg-background md:grid-cols-[260px_1fr]">
      <aside className="border-r border-border/60 bg-card">
        <div className="flex h-16 items-center gap-2 border-b border-border/60 px-5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground">
            <GraduationCap className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <div className="truncate font-display text-sm font-semibold">{schoolName}</div>
            <div className="text-xs text-muted-foreground">/{schoolSlug}</div>
          </div>
        </div>
        <nav className="space-y-1 p-3">
          {items.map((it) => {
            const active = it.exact ? path === it.to : path.startsWith(it.to);
            return (
              <Link
                key={it.to}
                to={it.to}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                <it.icon className="h-4 w-4" />
                {it.label}
              </Link>
            );
          })}
          <a
            href={`/${schoolSlug}`}
            target="_blank"
            rel="noreferrer"
            className="mt-4 flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <ExternalLink className="h-4 w-4" /> Public portal
          </a>
        </nav>
        <div className="absolute bottom-4 left-3 right-3 hidden md:block">
          <Button variant="ghost" size="sm" onClick={logout} className="w-full justify-start">
            <LogOut className="mr-2 h-4 w-4" /> Sign out
          </Button>
        </div>
      </aside>
      <main className="min-w-0">{children}</main>
    </div>
  );
}