import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { BookOpen, FileText, PlayCircle, Search, Download, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublicSchoolShell } from "@/components/site/PublicSchoolShell";
import { getSchoolBySlug } from "@/lib/schools.functions";

export const Route = createFileRoute("/$schoolSlug/tutorials")({
  loader: async ({ params }) => {
    const data = await getSchoolBySlug({ data: { slug: params.schoolSlug } });
    if (!data) throw notFound();
    return data;
  },
  head: ({ loaderData }) => ({
    meta: loaderData ? [
      { title: `Tutorials — ${loaderData.school.name}` },
      { name: "description", content: `Tutorials, guides and helpful resources for ${loaderData.school.name} results portal.` },
    ] : [{ title: "School not found" }],
  }),
  component: TutorialsPage,
  notFoundComponent: () => (
    <div className="grid min-h-screen place-items-center text-center"><div><h1 className="font-display text-2xl font-semibold">School not found</h1><Button asChild className="mt-4"><Link to="/">Go home</Link></Button></div></div>
  ),
});

type Tutorial = { id: string; title: string; description: string; type: "video" | "article" | "guide"; duration?: string; url?: string; category: string };

const tutorials: Tutorial[] = [
  { id: "1", title: "How to check your examination results", description: "A quick guide to finding and viewing student results on the school portal.", type: "video", duration: "4 min", category: "Getting started" },
  { id: "2", title: "Understanding the results portal", description: "Learn where to find results, announcements, rankings and student history.", type: "article", category: "Getting started" },
  { id: "3", title: "How to download a result slip", description: "Step-by-step instructions for opening and downloading an individual result slip.", type: "guide", category: "Results" },
];

function TutorialsPage() {
  const { school } = Route.useLoaderData();
  return <PublicSchoolShell school={school}>
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <section className="rounded-3xl border border-border/60 bg-card p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div><span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background px-3 py-1 text-xs font-medium text-muted-foreground"><BookOpen className="h-3.5 w-3.5 text-brand" /> Learning centre</span><h1 className="mt-3 font-display text-3xl font-semibold tracking-tight md:text-4xl">Tutorials</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Videos, articles and practical guides to help you get the most from the results portal.</p></div>
          <label className="flex h-10 w-full items-center gap-2 rounded-xl border border-border/70 bg-background px-3 sm:max-w-xs"><Search className="h-4 w-4 text-muted-foreground" /><input aria-label="Search tutorials" placeholder="Search tutorials..." className="min-w-0 flex-1 bg-transparent text-sm outline-none" /></label>
        </div>
      </section>
      <div className="mt-6 flex gap-2 overflow-x-auto pb-1 text-sm">{['All', 'Videos', 'Articles', 'Guides'].map((category, index) => <button key={category} className={`shrink-0 rounded-full border px-4 py-2 font-medium ${index === 0 ? 'border-primary bg-primary text-primary-foreground' : 'border-border/70 bg-card hover:bg-muted'}`}>{category}</button>)}</div>
      <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{tutorials.map((tutorial) => <TutorialCard key={tutorial.id} tutorial={tutorial} />)}</div>
    </div>
  </PublicSchoolShell>;
}

function TutorialCard({ tutorial }: { tutorial: Tutorial }) {
  const Icon = tutorial.type === "video" ? PlayCircle : tutorial.type === "guide" ? Download : FileText;
  return <article className="group overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
    <div className="grid aspect-[16/8] place-items-center bg-muted/60"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-background shadow-sm"><Icon className="h-6 w-6 text-brand" /></div></div>
    <div className="p-5"><div className="flex items-center justify-between gap-2 text-xs font-medium text-muted-foreground"><span className="capitalize">{tutorial.type}</span><span>{tutorial.duration ?? tutorial.category}</span></div><h2 className="mt-2 font-display text-lg font-semibold">{tutorial.title}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{tutorial.description}</p><Button asChild variant="ghost" className="mt-3 px-0 text-brand hover:bg-transparent hover:text-brand"><a href={tutorial.url || "#"} target={tutorial.url ? "_blank" : undefined} rel={tutorial.url ? "noreferrer" : undefined}>{tutorial.type === "video" ? "Watch tutorial" : tutorial.type === "guide" ? "Open guide" : "Read article"}<ExternalLink className="ml-2 h-3.5 w-3.5" /></a></Button></div>
  </article>;
}
