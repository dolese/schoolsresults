import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { searchStudents } from "@/lib/academic.functions";

export const Route = createFileRoute("/_authenticated/manage/$schoolSlug/search/student")({ component: Page });

function Page() {
  const { schoolSlug } = Route.useParams();
  const [q, setQ] = useState("");
  const fn = useServerFn(searchStudents);
  const { data, isLoading } = useQuery({ queryKey: ["search-students", schoolSlug, q], queryFn: () => fn({ data: { slug: schoolSlug, q } }) });

  return (
    <div className="p-6 md:p-10">
      <div className="mb-6 flex items-center gap-3">
        <Search className="h-5 w-5 text-muted-foreground" />
        <div>
          <h1 className="font-display text-2xl font-semibold">Find student</h1>
          <p className="text-sm text-muted-foreground">Search by admission number or name.</p>
        </div>
      </div>
      <div className="mb-4 max-w-lg">
        <Input placeholder="Type to search…" value={q} onChange={(e) => setQ(e.target.value)} autoFocus />
      </div>
      <div className="rounded-2xl border border-border/60 bg-card">
        {isLoading ? <p className="p-6 text-sm text-muted-foreground">Searching…</p> : (
          <div className="divide-y divide-border/60">
            {(data?.rows ?? []).map((s) => (
              <Link key={s.id} to="/$schoolSlug/students/$studentId/history" params={{ schoolSlug, studentId: s.id }} className="flex items-center justify-between p-4 hover:bg-muted/40">
                <div className="flex items-center gap-3">
                  <div className="grid h-9 w-9 place-items-center rounded-full bg-primary/10 text-primary"><User className="h-4 w-4" /></div>
                  <div>
                    <div className="font-medium">{s.full_name}</div>
                    <div className="text-xs text-muted-foreground">{s.admission_no} · {(s.forms as { name: string } | null)?.name ?? "-"} · {s.gender ?? "-"}</div>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">View history →</span>
              </Link>
            ))}
            {!isLoading && (data?.rows ?? []).length === 0 && <p className="p-6 text-sm text-muted-foreground">No students found.</p>}
          </div>
        )}
      </div>
    </div>
  );
}
