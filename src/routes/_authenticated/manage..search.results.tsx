import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search, FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { searchStudents } from "@/lib/academic.functions";
import { listExams } from "@/lib/manage.functions";

export const Route = createFileRoute("/_authenticated/manage/search/results")({ component: Page });

function Page() {
  const { schoolSlug } = Route.useParams();
  const [q, setQ] = useState("");
  const search = useServerFn(searchStudents);
  const list = useServerFn(listExams);
  const { data: sData } = useQuery({ queryKey: ["find-results-students", schoolSlug, q], queryFn: () => search({ data: { slug: schoolSlug, q } }), enabled: q.length >= 2 });
  const { data: eData } = useQuery({ queryKey: ["find-results-exams", schoolSlug], queryFn: () => list({ data: { slug: schoolSlug } }) });
  const publishedExams = (eData?.exams ?? []).filter((e) => e.published);

  return (
    <div className="p-6 md:p-10">
      <div className="mb-6 flex items-center gap-3">
        <Search className="h-5 w-5 text-muted-foreground" />
        <div>
          <h1 className="font-display text-2xl font-semibold">Find results</h1>
          <p className="text-sm text-muted-foreground">Look up a student and open their published result slips.</p>
        </div>
      </div>
      <div className="mb-4 max-w-lg">
        <Input placeholder="Search students…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      {q.length < 2 ? (
        <p className="text-sm text-muted-foreground">Type at least 2 characters.</p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {(sData?.rows ?? []).map((s) => (
            <div key={s.id} className="rounded-2xl border border-border/60 bg-card p-4">
              <div className="mb-2">
                <div className="font-medium">{s.full_name}</div>
                <div className="text-xs text-muted-foreground">{s.admission_no} · {(s.forms as { name: string } | null)?.name ?? "-"}</div>
              </div>
              <div className="space-y-1">
                {publishedExams.slice(0, 6).map((e) => (
                  <Link key={e.id} to="/$schoolSlug/results/$studentId" params={{ schoolSlug, studentId: s.id }} search={{ exam: e.id } as never} className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm hover:bg-muted/40">
                    <span className="flex items-center gap-2"><FileText className="h-3.5 w-3.5 text-muted-foreground" /> {e.name}</span>
                    <span className="text-xs text-muted-foreground">{e.year}</span>
                  </Link>
                ))}
                {publishedExams.length === 0 && <p className="text-xs text-muted-foreground">No published exams yet.</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
