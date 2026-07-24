import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { SlidersHorizontal, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { advancedSearch } from "@/lib/sims.functions";

export const Route = createFileRoute("/_authenticated/manage/$schoolSlug/search/advanced")({ component: Page });

function Page() {
  const { schoolSlug } = Route.useParams();
  const [q, setQ] = useState("");
  const fn = useServerFn(advancedSearch);
  const { data, isLoading } = useQuery({ queryKey: ["adv-search", schoolSlug, q], queryFn: () => fn({ data: { slug: schoolSlug, q } }), enabled: q.length > 0 });

  return (
    <div className="p-6 md:p-10">
      <div className="mb-6 flex items-center gap-3">
        <SlidersHorizontal className="h-5 w-5 text-muted-foreground" />
        <div>
          <h1 className="font-display text-2xl font-semibold">Advanced search</h1>
          <p className="text-sm text-muted-foreground">Search across students, exams, subjects, and announcements at once.</p>
        </div>
      </div>
      <div className="relative mb-6 max-w-xl">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Type a name, code, admission no, or keyword" className="pl-9" />
      </div>
      {!q && <p className="text-sm text-muted-foreground">Start typing to search everything.</p>}
      {q && (isLoading ? <p className="text-sm text-muted-foreground">Searching…</p> : (
        <div className="grid gap-6 md:grid-cols-2">
          <Section title={`Students (${data?.students.length ?? 0})`}>
            {data?.students.map((s) => (
              <Link key={s.id} to="/$schoolSlug/students/$studentId/history" params={{ schoolSlug, studentId: s.id }} className="flex items-center justify-between rounded-lg p-2 hover:bg-muted/50">
                <span className="font-medium">{s.full_name}</span>
                <span className="text-xs text-muted-foreground">{s.admission_no} · {(s.forms as { name: string } | null)?.name ?? "-"}</span>
              </Link>
            ))}
          </Section>
          <Section title={`Exams (${data?.exams.length ?? 0})`}>
            {data?.exams.map((e) => (
              <Link key={e.id} to="/manage/$schoolSlug/exams/$examId" params={{ schoolSlug, examId: e.id }} className="flex items-center justify-between rounded-lg p-2 hover:bg-muted/50">
                <span className="font-medium">{e.name}</span>
                <span className="text-xs text-muted-foreground">{e.year} · {e.published ? "Published" : "Draft"}</span>
              </Link>
            ))}
          </Section>
          <Section title={`Subjects (${data?.subjects.length ?? 0})`}>
            {data?.subjects.map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded-lg p-2">
                <span className="font-medium">{s.name}</span>
                <span className="font-mono text-xs text-muted-foreground">{s.code ?? "—"}</span>
              </div>
            ))}
          </Section>
          <Section title={`Announcements (${data?.announcements.length ?? 0})`}>
            {data?.announcements.map((a) => (
              <div key={a.id} className="rounded-lg p-2">
                <div className="font-medium">{a.title}</div>
                <div className="text-xs text-muted-foreground">{new Date(a.published_at).toLocaleDateString()}</div>
              </div>
            ))}
          </Section>
        </div>
      ))}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-4">
      <h3 className="mb-2 text-sm font-semibold text-muted-foreground">{title}</h3>
      <div className="space-y-1">{children}</div>
    </div>
  );
}
