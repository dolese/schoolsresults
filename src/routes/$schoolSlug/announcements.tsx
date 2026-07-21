import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Megaphone } from "lucide-react";
import { getPublicAnnouncements } from "@/lib/schools.functions";
import { Button } from "@/components/ui/button";
import { PublicSchoolShell } from "@/components/site/PublicSchoolShell";

export const Route = createFileRoute("/$schoolSlug/announcements")({
  loader: async ({ params }) => {
    const data = await getPublicAnnouncements({ data: { slug: params.schoolSlug } });
    if (!data) throw notFound();
    return data;
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `Announcements — ${loaderData.school.name}` },
          {
            name: "description",
            content: `Latest announcements from ${loaderData.school.name}.`,
          },
          {
            property: "og:title",
            content: `Announcements — ${loaderData.school.name}`,
          },
          {
            property: "og:url",
            content: `https://schoolsresults.lovable.app/${loaderData.school.slug}/announcements`,
          },
        ]
      : [{ title: "School not found" }],
    links: loaderData
      ? [
          {
            rel: "canonical",
            href: `https://schoolsresults.lovable.app/${loaderData.school.slug}/announcements`,
          },
        ]
      : [],
  }),
  component: AnnouncementsPage,
  notFoundComponent: () => (
    <div className="grid min-h-screen place-items-center text-center">
      <div>
        <h1 className="font-display text-2xl font-semibold">School not found</h1>
        <Button asChild className="mt-4">
          <Link to="/">Go home</Link>
        </Button>
      </div>
    </div>
  ),
});

function AnnouncementsPage() {
  const { school, announcements } = Route.useLoaderData();
  return (
    <PublicSchoolShell school={school}>
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="mb-8">
          <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/90 px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm">
            <Megaphone className="h-3.5 w-3.5 text-brand" /> School updates
          </span>
          <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight md:text-4xl">
            Announcements
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Notices and updates from {school.name}.
          </p>
        </div>

        {announcements.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/60 p-10 text-center text-muted-foreground">
            <Megaphone className="mx-auto mb-3 h-8 w-8 opacity-50" />
            No announcements yet.
          </div>
        ) : (
          <ol className="space-y-4">
            {announcements.map((a: { id: string; title: string; body: string; published_at: string }) => (
              <li
                key={a.id}
                className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm"
              >
                <div className="text-xs uppercase tracking-wider text-muted-foreground">
                  {new Date(a.published_at).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>
                <h2 className="mt-1 font-display text-xl font-semibold">{a.title}</h2>
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-foreground/85">
                  {a.body}
                </p>
              </li>
            ))}
          </ol>
        )}
      </div>
    </PublicSchoolShell>
  );
}