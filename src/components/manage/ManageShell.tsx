import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Megaphone,
  ExternalLink,
  LogOut,
  GraduationCap,
  BookOpen,
  Settings,
  Trophy,
  Home,
  Newspaper,
  ChevronsUpDown,
  ArrowLeftRight,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

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
  const base = `/manage/${schoolSlug}`;

  const isActive = (to: string, exact = false) =>
    exact ? path === to : path === to || path.startsWith(to + "/") || path.startsWith(to + "?");

  async function logout() {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  }

  const groups: {
    label: string;
    items: {
      to: string;
      label: string;
      icon: React.ComponentType<{ className?: string }>;
      exact?: boolean;
      sub?: { to: string; label: string }[];
      external?: boolean;
    }[];
  }[] = [
    {
      label: "Workspace",
      items: [
        { to: base, label: "Overview", icon: LayoutDashboard, exact: true },
        { to: `${base}/academics`, label: "Academics", icon: BookOpen },
      ],
    },
    {
      label: "People",
      items: [{ to: `${base}/students`, label: "Students", icon: Users }],
    },
    {
      label: "Assessment",
      items: [{ to: `${base}/exams`, label: "Exams & Marks", icon: ClipboardList }],
    },
    {
      label: "Community",
      items: [{ to: `${base}/announcements`, label: "Announcements", icon: Megaphone }],
    },
    {
      label: "Public portal",
      items: [
        { to: `/${schoolSlug}`, label: "School home", icon: Home, external: true },
        { to: `/${schoolSlug}/leaderboard`, label: "Leaderboard", icon: Trophy, external: true },
        { to: `/${schoolSlug}/announcements`, label: "News feed", icon: Newspaper, external: true },
      ],
    },
    {
      label: "Configuration",
      items: [{ to: `${base}/settings`, label: "Settings", icon: Settings }],
    },
  ];

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <Sidebar collapsible="icon">
          <SidebarHeader className="border-b border-border/60">
            <div className="flex items-center gap-2 px-2 py-2">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
                <GraduationCap className="h-5 w-5" />
              </span>
              <div className="min-w-0 group-data-[collapsible=icon]:hidden">
                <div className="truncate font-display text-sm font-semibold">{schoolName}</div>
                <div className="truncate text-xs text-muted-foreground">/{schoolSlug}</div>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent>
            {groups.map((group) => (
              <SidebarGroup key={group.label}>
                <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {group.items.map((it) => {
                      const active = isActive(it.to, it.exact);
                      if (it.external) {
                        return (
                          <SidebarMenuItem key={it.to}>
                            <SidebarMenuButton asChild tooltip={it.label}>
                              <a href={it.to} target="_blank" rel="noreferrer">
                                <it.icon className="h-4 w-4" />
                                <span>{it.label}</span>
                                <ExternalLink className="ml-auto h-3 w-3 opacity-60" />
                              </a>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        );
                      }
                      return (
                        <SidebarMenuItem key={it.to}>
                          <SidebarMenuButton asChild isActive={active} tooltip={it.label}>
                            <Link to={it.to}>
                              <it.icon className="h-4 w-4" />
                              <span>{it.label}</span>
                            </Link>
                          </SidebarMenuButton>
                          {it.sub && active && (
                            <SidebarMenuSub>
                              {it.sub.map((s) => (
                                <SidebarMenuSubItem key={s.to + s.label}>
                                  <SidebarMenuSubButton asChild>
                                    <Link to={s.to}>{s.label}</Link>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              ))}
                            </SidebarMenuSub>
                          )}
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            ))}
          </SidebarContent>

          <SidebarFooter className="border-t border-border/60">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Switch school">
                  <Link to="/app">
                    <ArrowLeftRight className="h-4 w-4" />
                    <span>Switch school</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={logout} tooltip="Sign out">
                  <LogOut className="h-4 w-4" />
                  <span>Sign out</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="min-w-0">
          <header className="sticky top-0 z-10 flex h-14 items-center gap-2 border-b border-border/60 bg-background/80 px-3 backdrop-blur">
            <SidebarTrigger />
            <div className="flex min-w-0 items-center gap-2">
              <ChevronsUpDown className="h-3 w-3 text-muted-foreground" />
              <span className="truncate text-sm font-medium">{schoolName}</span>
              <span className="hidden text-xs text-muted-foreground sm:inline">
                · staff dashboard
              </span>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Button asChild variant="outline" size="sm">
                <a href={`/${schoolSlug}`} target="_blank" rel="noreferrer">
                  <ExternalLink className="mr-2 h-3.5 w-3.5" />
                  Public portal
                </a>
              </Button>
            </div>
          </header>
          <div className="min-w-0">{children}</div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
