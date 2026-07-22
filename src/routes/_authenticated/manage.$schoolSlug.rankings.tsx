import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ListOrdered, Trophy } from "lucide-react";
import { getRankings } from "@/lib/dashboard.functions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/manage/$schoolSlug/rankings")({
  component: RankingsPage,
});

function RankingsPage() {
  const { schoolSlug } = Route.useParams();
  const fetchFn = useServerFn(getRankings);
  const [examId, setExamId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["rankings", schoolSlug, examId],
    queryFn: () => fetchFn({ data: { slug: schoolSlug, examId } }),
  });

  return (
    <div className="p-6 md:p-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold flex items-center gap-2">
            <ListOrdered className="h-5 w-5" /> Rankings
          </h1>
          <p className="text-sm text-muted-foreground">Ranked list of students for a published exam.</p>
        </div>
        {data && data.exams.length > 0 && (
          <div className="w-full max-w-xs">
            <Select value={data.examId ?? undefined} onValueChange={(v) => setExamId(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select exam" />
              </SelectTrigger>
              <SelectContent>
                {data.exams.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.name} · {e.year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : !data || data.exams.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/60 p-10 text-center">
          <Trophy className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Publish an exam to see rankings.</p>
        </div>
      ) : data.rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No marks recorded for this exam yet.</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border/60">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left">#</th>
                <th className="px-3 py-2 text-left">Adm</th>
                <th className="px-3 py-2 text-left">Name</th>
                <th className="px-3 py-2 text-right">Subjects</th>
                <th className="px-3 py-2 text-right">Average</th>
                <th className="px-3 py-2 text-right">Points</th>
                <th className="px-3 py-2 text-right">Division</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((r) => (
                <tr key={r.id} className="border-t border-border/60">
                  <td className="px-3 py-2 font-medium">{r.position}</td>
                  <td className="px-3 py-2 font-mono text-xs">{r.admission_no}</td>
                  <td className="px-3 py-2">{r.full_name}</td>
                  <td className="px-3 py-2 text-right text-muted-foreground">{r.subjects}</td>
                  <td className="px-3 py-2 text-right font-medium">{r.avg.toFixed(2)}</td>
                  <td className="px-3 py-2 text-right text-muted-foreground">{r.points || "-"}</td>
                  <td className="px-3 py-2 text-right">{r.division}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
