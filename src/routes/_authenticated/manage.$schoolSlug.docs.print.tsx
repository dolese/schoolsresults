import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Printer, FileText } from "lucide-react";
import { listExams } from "@/lib/manage.functions";

export const Route = createFileRoute("/_authenticated/manage/$schoolSlug/docs/print")({ component: Page });

function Page() {
  const { schoolSlug } = Route.useParams();
  const fn = useServerFn(listExams);
  const { data, isLoading } = useQuery({ queryKey: ["print-exams", schoolSlug], queryFn: () => fn({ data: { slug: schoolSlug } }) });
  const published = (data?.exams ?? []).filter((e) => e.published);

  return (
    <div className="p-6 md:p-10">
      <div className="mb-6 flex items-center gap-3">
        <Printer className="h-5 w-5 text-muted-foreground" />
        <div>
          <h1 className="font-display text-2xl font-semibold">Print center</h1>
          <p className="text-sm text-muted-foreground">Open a published exam to view report cards, then use your browser's print / save as PDF.</p>
        </div>
      </div>
      {isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {published.map((e) => (
            <Link key={e.id} to="/manage/$schoolSlug/reports/report-cards" params={{ schoolSlug }} className="group rounded-2xl border border-border/60 bg-card p-5 hover:border-primary/60">
              <div className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary"><FileText className="h-5 w-5" /></div>
              <div className="font-semibold">{e.name}</div>
              <div className="text-xs text-muted-foreground">{(e.forms as { name: string } | null)?.name ?? "-"} · {e.year}</div>
            </Link>
          ))}
          {published.length === 0 && <p className="col-span-full text-sm text-muted-foreground">Publish an exam to enable printing.</p>}
        </div>
      )}
    </div>
  );
}
