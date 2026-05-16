import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Search, GraduationCap, Megaphone } from "lucide-react";
import { getSchoolBySlug, searchPublicResults } from "@/lib/schools.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/$schoolSlug/")({
  loader: async ({ params }) => {
    const data = await getSchoolBySlug({ data: { slug: params.schoolSlug } });
    if (!data) throw notFound();
    return data;
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.school.name} — Results Portal` },
          { name: "description", content: `Check exam results for ${loaderData.school.name}.` },
          { property: "og:title", content: `${loaderData.school.name} — Results Portal` },
        ]
      : [{ title: "School not found" }],
  }),
  component: PublicSchoolPage,
  notFoundComponent: () => (
    <div className="grid min-h-screen place-items-center px-4 text-center">
      <div>
        <h1 className="font-display text-3xl font-semibold">School not found</h1>
        <p className="mt-2 text-muted-foreground">Check the link or search again.</p>
        <Button asChild className="mt-6"><Link to="/">Go home</Link></Button>
      </div>
    </div>
  ),
});

function PublicSchoolPage() {
  const { school, stats, latestExam, announcements } = Route.useLoaderData();
  const searchFn = useServerFn(searchPublicResults);
  const [query, setQuery] = useState("");
  const search = useMutation({
    mutationFn: (q: string) => searchFn({ data: { slug: school.slug, query: q } }),
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60 bg-card">
        <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            {school.logo_url ? (
              <img src={school.logo_url} alt={`${school.name} logo`} className="h-12 w-12 rounded-full object-cover" />
            ) : (
              <span className="grid h-12 w-12 place-items-center rounded-full bg-primary text-primary-foreground">
                <GraduationCap className="h-6 w-6" />
              </span>
            )}
            <div>
              <div className="font-display text-lg font-semibold leading-tight">{school.name}</div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Results Portal</div>
            </div>
          </div>
          <Button asChild variant="outline" size="sm"><Link to="/login">Staff login</Link></Button>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,oklch(0.32_0.13_260/0.2),transparent_60%)]" />
        <div className="mx-auto max-w-6xl px-4 py-16 text-center">
          {school.motto && <p className="mb-3 text-sm uppercase tracking-widest text-brand">{school.motto}</p>}
          <h1 className="font-display text-4xl font-semibold md:text-5xl">Check your results</h1>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Enter your admission number or full name to view your latest exam results.
          </p>
          <form
            className="mx-auto mt-8 flex max-w-xl gap-2"
            onSubmit={(e) => { e.preventDefault(); if (query.trim()) search.mutate(query.trim()); }}
          >
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Admission no. or student name" className="h-12 text-base" />
            <Button type="submit" disabled={search.isPending} className="h-12 bg-brand text-brand-foreground hover:bg-brand/90">
              <Search className="mr-2 h-4 w-4" /> Search
            </Button>
          </form>

          {search.data && (
            <div className="mx-auto mt-6 max-w-xl rounded-2xl border border-border/60 bg-card p-4 text-left">
              {search.data.matches.length === 0 ? (
                <p className="text-sm text-muted-foreground">No matching students found.</p>
              ) : (
                <ul className="divide-y divide-border/60">
                  {search.data.matches.map((m) => (
                    <li key={m.id} className="flex items-center justify-between py-3 text-sm">
                      <div>
                        <div className="font-medium">{m.full_name}</div>
                        <div className="text-xs text-muted-foreground">{m.admission_no} · {m.form ?? "—"} · {m.year}</div>
                      </div>
                      {latestExam && (
                        <Button asChild size="sm" variant="outline">
                          <Link to="/$schoolSlug/results/$studentId" params={{ schoolSlug: school.slug, studentId: m.id }}>
                            View
                          </Link>
                        </Button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-4 pb-12 md:grid-cols-3">
        {[
          { label: "Total students", v: stats.students },
          { label: "Active classes", v: stats.classes },
          { label: "Latest exam", v: latestExam?.name ?? "—" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-border/60 bg-card p-6">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</div>
            <div className="mt-2 font-display text-2xl font-semibold">{s.v}</div>
          </div>
        ))}
      </section>

      {announcements.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pb-20">
          <h2 className="font-display mb-4 flex items-center gap-2 text-xl font-semibold">
            <Megaphone className="h-5 w-5 text-brand" /> Announcements
          </h2>
          <div className="grid gap-3 md:grid-cols-2">
            {announcements.map((a) => (
              <article key={a.id} className="rounded-2xl border border-border/60 bg-card p-5">
                <div className="text-xs text-muted-foreground">{new Date(a.published_at).toLocaleDateString()}</div>
                <h3 className="mt-1 font-semibold">{a.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{a.body}</p>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
