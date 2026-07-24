import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Building2 } from "lucide-react";
import { listFormsAndSubjects } from "@/lib/manage.functions";

export const Route = createFileRoute("/_authenticated/manage/$schoolSlug/staff/departments")({ component: Page });

const DEPTS: Record<string, string[]> = {
  Sciences: ["physics", "chemistry", "biology", "mathematics", "phy", "che", "bio", "math"],
  Languages: ["english", "kiswahili", "french", "eng", "kis"],
  Humanities: ["geography", "history", "civics", "religious", "geo", "his", "civ"],
  Vocational: ["commerce", "bookkeeping", "computer", "agriculture", "ict"],
};

function deptOf(nameOrCode: string) {
  const s = nameOrCode.toLowerCase();
  for (const [d, keys] of Object.entries(DEPTS)) {
    if (keys.some((k) => s.includes(k))) return d;
  }
  return "Other";
}

function Page() {
  const { schoolSlug } = Route.useParams();
  const fn = useServerFn(listFormsAndSubjects);
  const { data, isLoading } = useQuery({ queryKey: ["dept-meta", schoolSlug], queryFn: () => fn({ data: { slug: schoolSlug } }) });
  const groups = new Map<string, { id: string; name: string; code: string | null }[]>();
  for (const s of data?.subjects ?? []) {
    const d = deptOf(`${s.name} ${s.code ?? ""}`);
    const arr = groups.get(d) ?? [];
    arr.push(s);
    groups.set(d, arr);
  }

  return (
    <div className="p-6 md:p-10">
      <div className="mb-6 flex items-center gap-3">
        <Building2 className="h-5 w-5 text-muted-foreground" />
        <div>
          <h1 className="font-display text-2xl font-semibold">Departments</h1>
          <p className="text-sm text-muted-foreground">Subjects grouped into academic departments.</p>
        </div>
      </div>
      {isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[...groups.entries()].map(([dept, subs]) => (
            <div key={dept} className="rounded-2xl border border-border/60 bg-card p-5">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-semibold">{dept}</h3>
                <span className="text-xs text-muted-foreground">{subs.length} subjects</span>
              </div>
              <ul className="space-y-2 text-sm">
                {subs.map((s) => (
                  <li key={s.id} className="flex items-center justify-between">
                    <span>{s.name}</span>
                    <span className="font-mono text-xs text-muted-foreground">{s.code ?? "—"}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {groups.size === 0 && <p className="text-sm text-muted-foreground">No subjects yet.</p>}
        </div>
      )}
    </div>
  );
}
