import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Medal, Award } from "lucide-react";
import { getMeritList } from "@/lib/dashboard.functions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/manage/$schoolSlug/merit-list")({
  component: MeritList,
});

function MeritList() {
  const { schoolSlug } = Route.useParams();
  const fetchFn = useServerFn(getMeritList);
  const [formId, setFormId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["merit-list", schoolSlug, formId],
    queryFn: () => fetchFn({ data: { slug: schoolSlug, formId, limit: 100 } }),
  });

  return (
    <div className="p-6 md:p-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold flex items-center gap-2">
            <Medal className="h-5 w-5" /> Merit list
          </h1>
          <p className="text-sm text-muted-foreground">Top performers across all published exams.</p>
        </div>
        {data && data.forms.length > 0 && (
          <div className="w-full max-w-xs">
            <Select value={formId ?? "all"} onValueChange={(v) => setFormId(v === "all" ? null : v)}>
              <SelectTrigger>
                <SelectValue placeholder="All forms" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All forms</SelectItem>
                {data.forms.map((f) => (
                  <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : !data || data.entries.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/60 p-10 text-center">
          <Award className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Publish exams and enter marks to build the merit list.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border/60">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left">#</th>
                <th className="px-3 py-2 text-left">Adm</th>
                <th className="px-3 py-2 text-left">Name</th>
                <th className="px-3 py-2 text-left">Form</th>
                <th className="px-3 py-2 text-right">Exams</th>
                <th className="px-3 py-2 text-right">Overall average</th>
              </tr>
            </thead>
            <tbody>
              {data.entries.map((e, i) => (
                <tr key={e.id} className="border-t border-border/60">
                  <td className="px-3 py-2 font-medium">
                    {i < 3 ? <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 text-primary">{i + 1}</span> : i + 1}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">{e.admission_no}</td>
                  <td className="px-3 py-2">{e.full_name}</td>
                  <td className="px-3 py-2 text-muted-foreground">{e.form}</td>
                  <td className="px-3 py-2 text-right text-muted-foreground">{e.examCount}</td>
                  <td className="px-3 py-2 text-right font-medium">{e.avg.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
