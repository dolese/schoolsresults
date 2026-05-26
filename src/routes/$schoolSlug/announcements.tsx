import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, Megaphone } from "lucide-react";
import { getPublicAnnouncements } from "@/lib/schools.functions";
import { Button } from "@/components/ui/button";

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
        ]
      : [{ title: "School not found" }],
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
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-10">
        <Button asChild variant="ghost" size="sm" className="mb-4">
          <Link to="/$schoolSlug" params={{ schoolSlug: school.slug }}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to {school.name}
          </Link>
        </Button>
        <div className="mb-8 flex items-center gap-3">
          {school.logo_url && (
            <img
              src={school.logo_url}
              alt=""
              className="h-12 w-12 rounded-full object-cover"
            />
          )}
          <div>
            <h1 className="font-display text-3xl font-semibold tracking-tight">
              Announcements
            </h1>
            <p className="text-sm text-muted-foreground">{school.name}</p>
          </div>
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
    </div>
  );
}