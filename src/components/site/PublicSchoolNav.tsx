import { Link } from "@tanstack/react-router";
import { GraduationCap, Megaphone, Trophy, Home as HomeIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

type SchoolLite = {
  slug: string;
  name: string;
  logo_url?: string | null;
};

export function PublicSchoolNav({ school }: { school: SchoolLite }) {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur">
      <div className="mx-auto grid h-16 max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 md:flex md:justify-between">
        <Link
          to="/$schoolSlug"
          params={{ schoolSlug: school.slug }}
          className="flex min-w-0 items-center gap-2"
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
          <span className="truncate font-display text-base font-semibold leading-tight md:text-lg">
            {school.name}
          </span>
        </Link>

        <nav className="flex items-center gap-1 text-sm md:gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link
              to="/$schoolSlug"
              params={{ schoolSlug: school.slug }}
              activeOptions={{ exact: true }}
              activeProps={{ className: "text-brand" }}
            >
              <HomeIcon className="h-4 w-4 md:mr-1.5" />
              <span className="hidden md:inline">Home</span>
            </Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link
              to="/$schoolSlug/leaderboard"
              params={{ schoolSlug: school.slug }}
              activeProps={{ className: "text-brand" }}
            >
              <Trophy className="h-4 w-4 md:mr-1.5" />
              <span className="hidden md:inline">Leaderboard</span>
            </Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link
              to="/$schoolSlug/announcements"
              params={{ schoolSlug: school.slug }}
              activeProps={{ className: "text-brand" }}
            >
              <Megaphone className="h-4 w-4 md:mr-1.5" />
              <span className="hidden md:inline">Announcements</span>
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="ml-1 hidden sm:inline-flex">
            <Link to="/login" search={{ redirect: `/manage/${school.slug}` } as never}>
              Staff sign in
            </Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}