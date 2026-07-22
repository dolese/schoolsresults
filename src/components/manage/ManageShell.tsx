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
  BarChart3,
  Bell,
  Activity,
  Award,
  ListOrdered,
  Medal,
  Layers,
  CalendarRange,
  CalendarDays,
  Sparkles,
  UserPlus,
  ArrowUpRight,
  Users2,
  Presentation,
  Building2,
  FileSpreadsheet,
  CheckCircle2,
  Send,
  History,
  Lock,
  FileBarChart,
  PieChart,
  LineChart,
  UserCheck,
  School,
  ClipboardCheck,
  FileText,
  ScrollText,
  Files,
  Printer,
  MessageSquare,
  Mail,
  Clock,
  Wallet,
  Receipt,
  Search,
  ShieldCheck,
  KeyRound,
  Plug,
  DatabaseBackup,
  SlidersHorizontal,
  UserCircle2,
  KeySquare,
  Palette,
  LifeBuoy,
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
  useSidebar,
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
  return (
    <SidebarProvider>
      <ManageShellInner schoolSlug={schoolSlug} schoolName={schoolName}>
        {children}
      </ManageShellInner>
    </SidebarProvider>
  );
}

function ManageShellInner({
  schoolSlug,
  schoolName,
  children,
}: {
  schoolSlug: string;
  schoolName: string;
  children: React.ReactNode;
}) {
  const navigate = useNavigate();
  const { isMobile, setOpenMobile } = useSidebar();
  const closeMobile = () => {
    if (isMobile) setOpenMobile(false);
  };
  const path = useRouterState({ select: (s) => s.location.pathname });
  const base = `/manage/${schoolSlug}`;

  const isActive = (to: string, exact = false) =>
    exact ? path === to : path === to || path.startsWith(to + "/") || path.startsWith(to + "?");

  async function logout() {
    closeMobile();
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
      label: "Dashboard",
      items: [
        { to: base, label: "Overview", icon: LayoutDashboard, exact: true },
        { to: `${base}/analytics`, label: "Analytics", icon: BarChart3 },
        { to: `${base}/activity`, label: "Recent activity", icon: Activity },
        { to: `${base}/notifications`, label: "Notifications", icon: Bell },
      ],
    },
    {
      label: "Academic",
      items: [
        { to: `${base}/academics`, label: "Subjects & forms", icon: BookOpen },
        { to: `${base}/exams`, label: "Examinations", icon: ClipboardList },
        { to: `${base}/results`, label: "Results", icon: Award },
        { to: `${base}/classes`, label: "Classes & streams", icon: Layers },
        { to: `${base}/years`, label: "Academic years", icon: CalendarRange },
        { to: `${base}/terms`, label: "Terms", icon: CalendarDays },
        { to: `${base}/grading`, label: "Grading system", icon: Sparkles },
        { to: `${base}/rankings`, label: "Rankings", icon: ListOrdered },
        { to: `${base}/merit-list`, label: "Merit list", icon: Medal },
      ],
    },
    {
      label: "Students",
      items: [
        { to: `${base}/students`, label: "Student list", icon: Users },
        { to: `${base}/students/profiles`, label: "Profiles", icon: UserCircle2 },
        { to: `${base}/students/admission`, label: "Admission", icon: UserPlus },
        { to: `${base}/students/promotion`, label: "Promotion", icon: ArrowUpRight },
        { to: `${base}/students/alumni`, label: "Alumni", icon: Users2 },
      ],
    },
    {
      label: "Staff",
      items: [
        { to: `${base}/staff/teachers`, label: "Teachers", icon: Presentation },
        { to: `${base}/staff/class-teachers`, label: "Class teachers", icon: UserCheck },
        { to: `${base}/staff/subject-teachers`, label: "Subject teachers", icon: BookOpen },
        { to: `${base}/staff/departments`, label: "Departments", icon: Building2 },
      ],
    },
    {
      label: "Assessment",
      items: [
        { to: `${base}/exams`, label: "Marks entry", icon: ClipboardCheck },
        { to: `${base}/assessment/import`, label: "Bulk import marks", icon: FileSpreadsheet },
        { to: `${base}/assessment/verify`, label: "Verify results", icon: CheckCircle2 },
        { to: `${base}/assessment/publish`, label: "Publish results", icon: Send },
        { to: `${base}/assessment/history`, label: "Result history", icon: History },
        { to: `${base}/assessment/locks`, label: "Lock / unlock", icon: Lock },
      ],
    },
    {
      label: "Reports",
      items: [
        { to: `${base}/reports/report-cards`, label: "Report cards", icon: FileBarChart },
        { to: `${base}/reports/class`, label: "Class performance", icon: BarChart3 },
        { to: `${base}/reports/subject`, label: "Subject analysis", icon: PieChart },
        { to: `${base}/reports/gender`, label: "Gender analysis", icon: LineChart },
        { to: `${base}/reports/teacher`, label: "Teacher performance", icon: UserCheck },
        { to: `${base}/reports/school`, label: "School performance", icon: School },
        { to: `${base}/reports/necta`, label: "NECTA analysis", icon: Trophy },
        { to: `${base}/reports/custom`, label: "Custom reports", icon: SlidersHorizontal },
      ],
    },
    {
      label: "Documents",
      items: [
        { to: `${base}/docs/certificates`, label: "Certificates", icon: ScrollText },
        { to: `${base}/docs/testimonials`, label: "Testimonials", icon: FileText },
        { to: `${base}/docs/templates`, label: "Report templates", icon: Files },
        { to: `${base}/docs/print`, label: "Print center", icon: Printer },
      ],
    },
    {
      label: "Community",
      items: [
        { to: `${base}/announcements`, label: "Announcements", icon: Megaphone },
        { to: `${base}/community/sms`, label: "SMS", icon: MessageSquare },
        { to: `${base}/community/email`, label: "Email", icon: Mail },
        { to: `${base}/community/notifications`, label: "Notifications", icon: Bell },
      ],
    },
    {
      label: "School management",
      items: [
        { to: `${base}/calendar`, label: "Academic calendar", icon: CalendarDays },
        { to: `${base}/timetable`, label: "Timetable", icon: Clock },
        { to: `${base}/attendance`, label: "Attendance", icon: ClipboardCheck },
      ],
    },
    {
      label: "Finance",
      items: [
        { to: `${base}/finance/fees`, label: "Fee status", icon: Wallet },
        { to: `${base}/finance/payments`, label: "Payment history", icon: Receipt },
      ],
    },
    {
      label: "Search",
      items: [
        { to: `${base}/search/student`, label: "Find student", icon: Search },
        { to: `${base}/search/results`, label: "Find results", icon: Search },
        { to: `${base}/search/advanced`, label: "Advanced search", icon: Search },
      ],
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
      label: "Administration",
      items: [
        { to: `${base}/settings`, label: "Settings", icon: Settings },
        { to: `${base}/admin/users`, label: "Users", icon: Users },
        { to: `${base}/admin/roles`, label: "Roles & permissions", icon: ShieldCheck },
        { to: `${base}/admin/branches`, label: "Branches / campuses", icon: Building2 },
        { to: `${base}/admin/audit`, label: "Audit logs", icon: History },
        { to: `${base}/admin/api-keys`, label: "API keys", icon: KeyRound },
        { to: `${base}/admin/integrations`, label: "Integrations", icon: Plug },
        { to: `${base}/admin/backup`, label: "Backup & restore", icon: DatabaseBackup },
      ],
    },
    {
      label: "Account",
      items: [
        { to: `${base}/account/profile`, label: "My profile", icon: UserCircle2 },
        { to: `${base}/account/password`, label: "Change password", icon: KeySquare },
        { to: `${base}/account/theme`, label: "Theme", icon: Palette },
        { to: `${base}/account/help`, label: "Help & support", icon: LifeBuoy },
      ],
    },
  ];

  return (
    <>
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

          <SidebarContent className="overscroll-contain">
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
                              <a
                                href={it.to}
                                target="_blank"
                                rel="noreferrer"
                                onClick={closeMobile}
                              >
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
                            <Link to={it.to} onClick={closeMobile}>
                              <it.icon className="h-4 w-4" />
                              <span>{it.label}</span>
                            </Link>
                          </SidebarMenuButton>
                          {it.sub && active && (
                            <SidebarMenuSub>
                              {it.sub.map((s) => (
                                <SidebarMenuSubItem key={s.to + s.label}>
                                  <SidebarMenuSubButton asChild>
                                    <Link to={s.to} onClick={closeMobile}>
                                      {s.label}
                                    </Link>
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
                  <Link to="/app" onClick={closeMobile}>
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
          <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-border/60 bg-background/90 px-3 backdrop-blur supports-[backdrop-filter]:bg-background/70">
            <SidebarTrigger />
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <ChevronsUpDown className="h-3 w-3 text-muted-foreground" />
              <span className="min-w-0 truncate text-sm font-medium">{schoolName}</span>
              <span className="hidden text-xs text-muted-foreground sm:inline">
                · staff dashboard
              </span>
            </div>
            <div className="ml-auto flex shrink-0 items-center gap-2">
              <Button asChild variant="outline" size="sm" className="h-8 px-2 sm:px-3">
                <a href={`/${schoolSlug}`} target="_blank" rel="noreferrer">
                  <ExternalLink className="h-3.5 w-3.5 sm:mr-2" />
                  <span className="hidden sm:inline">Public portal</span>
                </a>
              </Button>
            </div>
          </header>
          <div className="min-w-0">{children}</div>
        </SidebarInset>
    </>
  );
}
