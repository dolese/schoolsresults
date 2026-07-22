import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { FileBarChart, ExternalLink } from "lucide-react";
import { listExams } from "@/lib/manage.functions";
import { listReportCards } from "@/lib/dashboard.functions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute(
  "/_authenticated/manage/$schoolSlug/reports/report-cards",
)({ component: ReportCardsPage });

function ReportCardsPage() {
  const { schoolSlug } = Route.useParams();
  const listExamsFn = useServerFn(listExams);
  const listCardsFn = useServerFn(listReportCards);
  const [examId, setExamId] = useState<string | null>(null);

  const { data: examsData } = useQuery({
    queryKey: ["exams", schoolSlug],
    queryFn: () => listExamsFn({ data: { slug: schoolSlug } }),
  });

  const publishedExams = (examsData?.exams ?? []).filter((e) => e.published);

  useEffect(() => {
    if (!examId && publishedExams.length) setExamId(publishedExams[0].id);
  }, [examId, publishedExams]);

  const { data, isLoading } = useQuery({
    queryKey: ["report-cards", schoolSlug, examId],
    queryFn: () => listCardsFn({ data: { slug: schoolSlug, examId: examId! } }),
    enabled: !!examId,
  });

  return (
    <div className="p-6 md:p-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold flex items-center gap-2">
            <FileBarChart className="h-5 w-5" /> Report cards
          </h1>
          <p className="text-sm text-muted-foreground">Open a student's printable result slip.</p>
        </div>
        {publishedExams.length > 0 && (
          <div className="w-full max-w-xs">
            <Select value={examId ?? undefined} onValueChange={setExamId}>
              <SelectTrigger>
                <SelectValue placeholder="Select exam" />
              </SelectTrigger>
              <SelectContent>
                {publishedExams.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.name} · {e.year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {publishedExams.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/60 p-10 text-center">
          <p className="text-sm text-muted-foreground">
            Publish an exam first to generate report cards.
          </p>
        </div>
      ) : isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : !data || data.rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No students in this form.</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border/60">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left">Adm</th>
                <th className="px-3 py-2 text-left">Name</th>
                <th className="px-3 py-2 text-right">Subjects</th>
                <th className="px-3 py-2 text-right">Average</th>
                <th className="px-3 py-2 text-right">Grade</th>
                <th className="px-3 py-2 text-right">Division</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((r) => (
                <tr key={r.id} className="border-t border-border/60">
                  <td className="px-3 py-2 font-mono text-xs">{r.admission_no}</td>
                  <td className="px-3 py-2">{r.full_name}</td>
                  <td className="px-3 py-2 text-right text-muted-foreground">{r.subjects}</td>
                  <td className="px-3 py-2 text-right">{r.avg.toFixed(2)}</td>
                  <td className="px-3 py-2 text-right font-medium">{r.grade}</td>
                  <td className="px-3 py-2 text-right">{r.division}</td>
                  <td className="px-3 py-2 text-right">
                    <Button asChild size="sm" variant="outline">
                      <a href={`/${schoolSlug}/results/${r.id}`} target="_blank" rel="noreferrer">
                        Open <ExternalLink className="ml-1.5 h-3 w-3" />
                      </a>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
