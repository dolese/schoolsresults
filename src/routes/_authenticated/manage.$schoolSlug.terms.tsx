import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays } from "lucide-react";
import { listAcademicYears } from "@/lib/academic.functions";

export const Route = createFileRoute("/_authenticated/manage/$schoolSlug/terms")({ component: Page });

const TERMS = [
  { name: "Term I", window: "Jan – Apr", weeks: 14 },
  { name: "Term II", window: "May – Aug", weeks: 14 },
  { name: "Term III", window: "Sep – Dec", weeks: 12 },
];

function Page() {
  const { schoolSlug } = Route.useParams();
  const fn = useServerFn(listAcademicYears);
  const { data } = useQuery({ queryKey: ["terms-years", schoolSlug], queryFn: () => fn({ data: { slug: schoolSlug } }) });
  const years = data?.years ?? [];
  const current = years.find((y) => y.is_current) ?? years[0];

  return (
    <div className="p-6 md:p-10">
      <div className="mb-6 flex items-center gap-3">
        <CalendarDays className="h-5 w-5 text-muted-foreground" />
        <div>
          <h1 className="font-display text-2xl font-semibold">Terms</h1>
          <p className="text-sm text-muted-foreground">Standard Tanzanian tri-semester calendar for {current ? current.year : "your current year"}.</p>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {TERMS.map((t) => (
          <div key={t.name} className="rounded-2xl border border-border/60 bg-card p-5">
            <div className="text-sm font-semibold">{t.name}</div>
            <div className="mt-1 text-xs text-muted-foreground">{t.window}</div>
            <div className="mt-4 flex items-baseline gap-1"><span className="text-3xl font-semibold">{t.weeks}</span><span className="text-xs text-muted-foreground">weeks</span></div>
          </div>
        ))}
      </div>
      <p className="mt-6 max-w-2xl text-xs text-muted-foreground">Tag each exam with a term when creating it under Exams to organise term-level reports.</p>
    </div>
  );
}
