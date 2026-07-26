import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Building2 } from "lucide-react";
import { getMySchools } from "@/lib/schools.functions";

export const Route = createFileRoute("/_authenticated/manage/$schoolSlug/admin/branches")({ component: Page });

function Page() {
  const { schoolSlug } = Route.useParams();
  const fn = useServerFn(getMySchools);
  const { data } = useQuery({ queryKey: ["my-schools"], queryFn: () => fn() });
  const schools = data?.schools ?? [];

  return (
    <div className="p-6 md:p-10">
      <div className="mb-6 flex items-center gap-3">
        <Building2 className="h-5 w-5 text-muted-foreground" />
        <div>
          <h1 className="font-display text-2xl font-semibold">Branches / campuses</h1>
          <p className="text-sm text-muted-foreground">All school workspaces you belong to. Each is a fully-isolated tenant.</p>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {schools.map(({ role, school }) => (
          <Link
            key={school.id}
            to="/manage/$schoolSlug"
            params={{ schoolSlug: school.slug }}
            className={`rounded-2xl border p-5 transition hover:border-primary/60 hover:bg-primary/5 ${school.slug === schoolSlug ? "border-primary bg-primary/5" : "border-border/60 bg-card"}`}
          >
            <div className="flex items-center justify-between">
              <div className="font-semibold">{school.name}</div>
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{role}</span>
            </div>
            <div className="mt-1 font-mono text-xs text-muted-foreground">/{school.slug}</div>
            <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
              <span className="rounded-md bg-muted px-2 py-0.5">{school.status}</span>
              {school.region && <span>{school.region}</span>}
            </div>
          </Link>
        ))}
        {schools.length === 0 && <p className="text-sm text-muted-foreground">No workspaces yet.</p>}
      </div>
    </div>
  );
}
