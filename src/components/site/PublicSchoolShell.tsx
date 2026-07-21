import { Link, useRouterState } from "@tanstack/react-router";
import {
  GraduationCap,
  Home as HomeIcon,
  Trophy,
  Megaphone,
  Search,
  LogIn,
  ExternalLink,
  ChevronsUpDown,
} from "lucide-react";
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
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

type SchoolLite = {
  slug: string;
  name: string;
  logo_url?: string | null;
  region?: string | null;
  motto?: string | null;
};

export function PublicSchoolShell({
  school,
  children,
}: {
  school: SchoolLite;
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <ShellInner school={school}>{children}</ShellInner>
    </SidebarProvider>
  );
}

function ShellInner({
  school,
  children,
}: {
  school: SchoolLite;
  children: React.ReactNode;
}) {
  const { isMobile, setOpenMobile } = useSidebar();
  const closeMobile = () => {
    if (isMobile) setOpenMobile(false);
  };
  const path = useRouterState({ select: (s) => s.location.pathname });
  const base = `/${school.slug}`;

  const isActive = (to: string, exact = false) =>
    exact ? path === to : path === to || path.startsWith(to + "/");

  const groups: {
    label: string;
    items: {
      to: string;
      label: string;
      icon: React.ComponentType<{ className?: string }>;
      exact?: boolean;
      params?: Record<string, string>;
    }[];
  }[] = [
    {
      label: "Portal",
      items: [
        { to: "/$schoolSlug", label: "Home", icon: HomeIcon, exact: true, params: { schoolSlug: school.slug } },
        { to: "/$schoolSlug/leaderboard", label: "Leaderboard", icon: Trophy, params: { schoolSlug: school.slug } },
        { to: "/$schoolSlug/announcements", label: "Announcements", icon: Megaphone, params: { schoolSlug: school.slug } },
      ],
    },
  ];

  const resolvedActive = (raw: string) => {
    // raw uses $schoolSlug placeholder; compute concrete path for isActive
    const concrete = raw.replace("$schoolSlug", school.slug);
    return isActive(concrete, concrete === base);
  };

  return (
    <>
      <Sidebar collapsible="icon">
        <SidebarHeader className="border-b border-border/60">
          <Link
            to="/$schoolSlug"
            params={{ schoolSlug: school.slug }}
            onClick={closeMobile}
            className="flex items-center gap-2 px-2 py-2"
          >
            {school.logo_url ? (
              <img
                src={school.logo_url}
                alt=""
                className="h-9 w-9 shrink-0 rounded-xl object-cover ring-1 ring-border"
              />
            ) : (
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
                <GraduationCap className="h-5 w-5" />
              </span>
            )}
            <div className="min-w-0 group-data-[collapsible=icon]:hidden">
              <div className="truncate font-display text-sm font-semibold">{school.name}</div>
              <div className="truncate text-xs text-muted-foreground">/{school.slug}</div>
            </div>
          </Link>
        </SidebarHeader>

        <SidebarContent className="overscroll-contain">
          {groups.map((group) => (
            <SidebarGroup key={group.label}>
              <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map((it) => (
                    <SidebarMenuItem key={it.label}>
                      <SidebarMenuButton
                        asChild
                        isActive={resolvedActive(it.to)}
                        tooltip={it.label}
                      >
                        <Link to={it.to} params={it.params as never} onClick={closeMobile}>
                          <it.icon className="h-4 w-4" />
                          <span>{it.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}

          <SidebarGroup>
            <SidebarGroupLabel>Quick access</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Search results">
                    <Link
                      to="/$schoolSlug"
                      params={{ schoolSlug: school.slug }}
                      hash="search"
                      onClick={closeMobile}
                    >
                      <Search className="h-4 w-4" />
                      <span>Search results</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="border-t border-border/60">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Staff sign in">
                <Link
                  to="/login"
                  search={{ redirect: `/manage/${school.slug}` } as never}
                  onClick={closeMobile}
                >
                  <LogIn className="h-4 w-4" />
                  <span>Staff sign in</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="All schools">
                <Link to="/" onClick={closeMobile}>
                  <ExternalLink className="h-4 w-4" />
                  <span>All schools</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset className="min-w-0">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border/60 bg-background/90 px-3 backdrop-blur supports-[backdrop-filter]:bg-background/70">
          <SidebarTrigger />
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <ChevronsUpDown className="h-3 w-3 text-muted-foreground" />
            <span className="min-w-0 truncate text-sm font-medium">{school.name}</span>
            <span className="hidden text-xs text-muted-foreground sm:inline">· results portal</span>
          </div>
          <div className="ml-auto flex shrink-0 items-center gap-2">
            <Button asChild variant="outline" size="sm" className="h-8 px-2 sm:px-3">
              <Link to="/login" search={{ redirect: `/manage/${school.slug}` } as never}>
                <LogIn className="h-3.5 w-3.5 sm:mr-2" />
                <span className="hidden sm:inline">Staff sign in</span>
              </Link>
            </Button>
          </div>
        </header>
        <div className="min-w-0">{children}</div>
      </SidebarInset>
    </>
  );
}