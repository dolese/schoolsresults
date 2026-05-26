import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  ArrowRight,
  BookOpenCheck,
  GraduationCap,
  Megaphone,
  Search,
  ShieldCheck,
  Trophy,
} from "lucide-react";
import { getSchoolBySlug, searchPublicResults } from "@/lib/schools.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/$schoolSlug/")({
  loader: async ({ params }) => {
    const data = await getSchoolBySlug({ data: { slug: params.schoolSlug } });
    if (!data) throw notFound();
    return data;
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.school.name} - Results Portal` },
          { name: "description", content: `Check exam results for ${loaderData.school.name}.` },
          { property: "og:title", content: `${loaderData.school.name} - Results Portal` },
        ]
      : [{ title: "School not found" }],
  }),
  component: PublicSchoolPage,
  notFoundComponent: () => (
    <div className="grid min-h-screen place-items-center px-4 text-center">
      <div>
        <h1 className="font-display text-3xl font-semibold">School not found</h1>
        <p className="mt-2 text-muted-foreground">Check the link or search again.</p>
        <Button asChild className="mt-6">
          <Link to="/">Go home</Link>
        </Button>
      </div>
    </div>
  ),
});

function PublicSchoolPage() {
  const { school, stats, latestExam, announcements, forms, publishedExams, years } =
    Route.useLoaderData();
  const searchFn = useServerFn(searchPublicResults);
  const [query, setQuery] = useState("");
  const [selectedExamId, setSelectedExamId] = useState("latest");
  const [selectedFormLevel, setSelectedFormLevel] = useState("all");
  const [selectedYear, setSelectedYear] = useState("all");
  const search = useMutation({
    mutationFn: (value: {
      query: string;
      examId: string | null;
      formLevel: number | null;
      year: number | null;
    }) =>
      searchFn({
        data: {
          slug: school.slug,
          query: value.query,
          examId: value.examId,
          formLevel: value.formLevel,
          year: value.year,
        },
      }),
  });

  const selectedExam =
    selectedExamId === "latest"
      ? latestExam
      : publishedExams.find((exam: { id: string }) => exam.id === selectedExamId) ?? null;

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    search.mutate({
      query: query.trim(),
      examId: selectedExamId === "latest" ? null : selectedExamId,
      formLevel: selectedFormLevel === "all" ? null : Number(selectedFormLevel),
      year: selectedYear === "all" ? null : Number(selectedYear),
    });
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,oklch(0.99_0.005_240),oklch(0.97_0.01_245))]">
      <header className="border-b border-border/60 bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            {school.logo_url ? (
              <img
                src={school.logo_url}
                alt={`${school.name} logo`}
                className="h-12 w-12 rounded-2xl object-cover ring-1 ring-border"
              />
            ) : (
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary text-primary-foreground">
                <GraduationCap className="h-6 w-6" />
              </span>
            )}
            <div>
              <div className="font-display text-lg font-semibold leading-tight">{school.name}</div>
              <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                Official results portal
              </div>
            </div>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link to="/login" search={{ redirect: `/manage/${school.slug}` } as never}>
              Staff sign in
            </Link>
          </Button>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,oklch(0.74_0.17_60/0.22),transparent_30%),radial-gradient(circle_at_top_right,oklch(0.32_0.13_260/0.18),transparent_36%)]" />
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 md:grid-cols-[1.15fr_0.85fr] md:py-24">
            <div className="flex flex-col justify-center">
              <span className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-border/70 bg-card/90 px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm">
                <ShieldCheck className="h-3.5 w-3.5 text-brand" />
                Published results only
              </span>
              <h1 className="font-display text-4xl font-semibold leading-tight md:text-6xl">
                Results, announcements, and exam updates for{" "}
                <span className="text-brand">{school.name}</span>
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
                Students and parents can search by admission number or name, filter by exam, form,
                or year, and open published result slips instantly.
              </p>

              <div className="mt-6 flex flex-wrap gap-3 text-sm text-muted-foreground">
                {school.region && (
                  <span className="rounded-full bg-card px-3 py-1 shadow-sm ring-1 ring-border">
                    Region: {school.region}
                  </span>
                )}
                <span className="rounded-full bg-card px-3 py-1 shadow-sm ring-1 ring-border">
                  Portal: /{school.slug}
                </span>
                <span className="rounded-full bg-card px-3 py-1 shadow-sm ring-1 ring-border">
                  Latest exam: {latestExam?.name ?? "Not published yet"}
                </span>
              </div>

              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                {[
                  { label: "Students", value: stats.students, icon: Trophy },
                  { label: "Forms", value: stats.classes, icon: BookOpenCheck },
                  { label: "Announcements", value: announcements.length, icon: Megaphone },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-border/60 bg-card/90 p-5 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                        {item.label}
                      </div>
                      <item.icon className="h-4 w-4 text-brand" />
                    </div>
                    <div className="mt-3 font-display text-3xl font-semibold">{item.value}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-border/60 bg-card/95 p-6 shadow-2xl shadow-primary/5 backdrop-blur">
              <div className="flex items-start justify-between gap-4 border-b border-border/60 pb-5">
                <div>
                  <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Search results
                  </div>
                  <h2 className="mt-2 font-display text-2xl font-semibold">Find a student result</h2>
                </div>
                <span className="rounded-full bg-brand/15 px-3 py-1 text-xs font-medium text-brand">
                  Live portal
                </span>
              </div>

              <form className="mt-6 space-y-3" onSubmit={handleSearchSubmit}>
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Admission no. or student name"
                  className="h-12 text-base"
                />
                <div className="grid gap-3 sm:grid-cols-3">
                  <Select value={selectedExamId} onValueChange={setSelectedExamId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Exam" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="latest">Latest published</SelectItem>
                      {publishedExams.map(
                        (exam: {
                          id: string;
                          name: string;
                          year: number;
                          form: { name: string } | null;
                        }) => (
                          <SelectItem key={exam.id} value={exam.id}>
                            {exam.name} - {exam.form?.name ?? "All forms"} - {exam.year}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                  <Select value={selectedFormLevel} onValueChange={setSelectedFormLevel}>
                    <SelectTrigger>
                      <SelectValue placeholder="Form" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All forms</SelectItem>
                      {forms.map((form: { id: string; name: string; level: number }) => (
                        <SelectItem key={form.id} value={String(form.level)}>
                          {form.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger>
                      <SelectValue placeholder="Year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All years</SelectItem>
                      {years.map((year: number) => (
                        <SelectItem key={year} value={String(year)}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  type="submit"
                  disabled={search.isPending}
                  className="h-12 w-full bg-brand text-brand-foreground hover:bg-brand/90"
                >
                  <Search className="mr-2 h-4 w-4" />
                  {search.isPending ? "Searching..." : "Search published results"}
                </Button>
              </form>

              <div className="mt-5 rounded-2xl bg-secondary/70 p-4 text-sm text-muted-foreground">
                <div className="font-medium text-foreground">How it works</div>
                <p className="mt-1">
                  Search for a student, open the published result slip, then print or save it as a
                  PDF from the result page.
                </p>
              </div>

              {search.data && (
                <div className="mt-5 rounded-2xl border border-border/60 bg-background">
                  {search.data.matches.length === 0 ? (
                    <p className="p-4 text-sm text-muted-foreground">No matching students found.</p>
                  ) : (
                    <ul className="divide-y divide-border/60">
                      {search.data.matches.map(
                        (match: {
                          id: string;
                          full_name: string;
                          admission_no: string;
                          form: string | null;
                          year: number;
                        }) => (
                          <li
                            key={match.id}
                            className="flex items-center justify-between gap-4 px-4 py-3 text-sm"
                          >
                            <div className="min-w-0">
                              <div className="truncate font-medium">{match.full_name}</div>
                              <div className="text-xs text-muted-foreground">
                                {match.admission_no} - {match.form ?? "No form"} - {match.year}
                              </div>
                            </div>
                            <Button asChild size="sm" variant="outline">
                              <Link
                                to="/$schoolSlug/results/$studentId"
                                params={{ schoolSlug: school.slug, studentId: match.id }}
                                search={
                                  selectedExam?.id
                                    ? ({ examId: selectedExam.id } as never)
                                    : ({} as never)
                                }
                              >
                                View
                              </Link>
                            </Button>
                          </li>
                        ),
                      )}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-8">
          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                title: "Fast result lookup",
                body: "Search by admission number or student name from any phone or desktop browser.",
                icon: Search,
              },
              {
                title: "Exam-aware filtering",
                body: "Filter searches by published exam, form, and year for clearer multi-school reporting.",
                icon: BookOpenCheck,
              },
              {
                title: "School communication",
                body: "Announcements appear directly on the portal so families see key updates in one place.",
                icon: Megaphone,
              },
            ].map((feature) => (
              <article
                key={feature.title}
                className="rounded-3xl border border-border/60 bg-card p-6 shadow-sm"
              >
                <feature.icon className="h-5 w-5 text-brand" />
                <h3 className="mt-4 font-display text-xl font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{feature.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-12">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl font-semibold">Latest announcements</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Important notices published by {school.name}.
              </p>
            </div>
            <Button asChild variant="ghost" className="hidden md:inline-flex">
              <Link
                to="/$schoolSlug/announcements"
                params={{ schoolSlug: school.slug }}
              >
                View all <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          {announcements.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {announcements.map(
                (announcement: { id: string; title: string; body: string; published_at: string }) => (
                  <article
                    key={announcement.id}
                    className="rounded-3xl border border-border/60 bg-card p-6 shadow-sm"
                  >
                    <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      {new Date(announcement.published_at).toLocaleDateString()}
                    </div>
                    <h3 className="mt-3 font-display text-xl font-semibold">{announcement.title}</h3>
                    <p className="mt-3 line-clamp-4 text-sm leading-6 text-muted-foreground">
                      {announcement.body}
                    </p>
                  </article>
                ),
              )}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-border/60 bg-card p-10 text-center">
              <Megaphone className="mx-auto h-8 w-8 text-muted-foreground" />
              <h3 className="mt-4 font-display text-xl font-semibold">No announcements yet</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                The school has not posted public notices yet. Check back later for updates.
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
