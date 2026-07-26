import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ScrollText, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { searchStudents } from "@/lib/academic.functions";

export const Route = createFileRoute("/_authenticated/manage/$schoolSlug/docs/testimonials")({ component: Page });

function Page() {
  const { schoolSlug } = Route.useParams();
  const [q, setQ] = useState("");
  const fn = useServerFn(searchStudents);
  const { data, isLoading } = useQuery({ queryKey: ["testimonial-search", schoolSlug, q], queryFn: () => fn({ data: { slug: schoolSlug, q } }), enabled: q.length > 0 });

  return (
    <div className="p-6 md:p-10">
      <div className="mb-6 flex items-center gap-3">
        <ScrollText className="h-5 w-5 text-muted-foreground" />
        <div>
          <h1 className="font-display text-2xl font-semibold">Testimonials</h1>
          <p className="text-sm text-muted-foreground">Find a student and open their result slip to print a testimonial.</p>
        </div>
      </div>
      <div className="relative mb-6 max-w-lg">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or admission number" className="pl-9" />
      </div>
      {q && (isLoading ? <p className="text-sm text-muted-foreground">Searching…</p> : (
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-card">
          <table className="w-full text-sm">
            <tbody>
              {(data?.rows ?? []).map((s) => (
                <tr key={s.id} className="border-t border-border/50">
                  <td className="p-3 font-mono text-xs">{s.admission_no}</td>
                  <td className="font-medium">{s.full_name}</td>
                  <td className="text-muted-foreground">{(s.forms as { name: string } | null)?.name ?? "-"}</td>
                  <td className="p-3 text-right">
                    <Link to="/$schoolSlug/results/$studentId" params={{ schoolSlug, studentId: s.id }} className="text-primary hover:underline">Open</Link>
                  </td>
                </tr>
              ))}
              {(data?.rows ?? []).length === 0 && <tr><td className="p-6 text-center text-muted-foreground">No matches.</td></tr>}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
