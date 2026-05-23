import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ExternalLink, Save } from "lucide-react";
import { getSchoolSettings, updateSchoolSettings } from "@/lib/school-admin.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/manage/$schoolSlug/settings")({
  head: () => ({ meta: [{ title: "Settings - School portal" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const { schoolSlug } = Route.useParams();
  const qc = useQueryClient();
  const fetchSettings = useServerFn(getSchoolSettings);
  const saveSettingsFn = useServerFn(updateSchoolSettings);

  const settings = useQuery({
    queryKey: ["school-settings", schoolSlug],
    queryFn: () => fetchSettings({ data: { slug: schoolSlug } }),
  });

  const [form, setForm] = useState({
    name: "",
    region: "",
    motto: "",
    logo_url: "",
  });

  useEffect(() => {
    if (!settings.data) return;
    setForm({
      name: settings.data.school.name,
      region: settings.data.school.region ?? "",
      motto: settings.data.school.motto ?? "",
      logo_url: settings.data.school.logo_url ?? "",
    });
  }, [settings.data]);

  const save = useMutation({
    mutationFn: () =>
      saveSettingsFn({
        data: {
          slug: schoolSlug,
          name: form.name,
          region: form.region || null,
          motto: form.motto || null,
          logo_url: form.logo_url || null,
        },
      }),
    onSuccess: () => {
      toast.success("School settings updated");
      qc.invalidateQueries({ queryKey: ["school-settings", schoolSlug] });
      qc.invalidateQueries({ queryKey: ["manage-overview", schoolSlug] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to save settings"),
  });

  return (
    <div className="mx-auto max-w-6xl p-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold">School settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage the branding and profile shown on your public portal.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link to="/$schoolSlug" params={{ schoolSlug }} target="_blank">
            Open public portal <ExternalLink className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-2xl border border-border/60 bg-card p-6">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label>School name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Region</Label>
              <Input
                value={form.region}
                onChange={(e) => setForm((prev) => ({ ...prev, region: e.target.value }))}
                placeholder="e.g. Mbeya"
              />
            </div>
            <div className="space-y-2">
              <Label>Motto</Label>
              <Textarea
                rows={3}
                value={form.motto}
                onChange={(e) => setForm((prev) => ({ ...prev, motto: e.target.value }))}
                placeholder="Short message shown on the portal hero"
              />
            </div>
            <div className="space-y-2">
              <Label>Logo URL</Label>
              <Input
                value={form.logo_url}
                onChange={(e) => setForm((prev) => ({ ...prev, logo_url: e.target.value }))}
                placeholder="https://..."
              />
            </div>

            <div className="rounded-xl bg-secondary/60 p-4 text-sm text-muted-foreground">
              Current slug: <span className="font-medium text-foreground">/{schoolSlug}</span>
              {settings.data && (
                <>
                  <br />
                  Status:{" "}
                  <span className="font-medium text-foreground">{settings.data.school.status}</span>
                  {" - "}
                  Plan:{" "}
                  <span className="font-medium text-foreground">{settings.data.school.plan}</span>
                </>
              )}
            </div>

            <div>
              <Button
                onClick={() => save.mutate()}
                disabled={save.isPending || !form.name.trim()}
                className="bg-brand text-brand-foreground hover:bg-brand/90"
              >
                <Save className="mr-2 h-4 w-4" />
                {save.isPending ? "Saving..." : "Save settings"}
              </Button>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-border/60 bg-card p-6">
          <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Portal preview
          </div>
          <div className="mt-4 rounded-[2rem] border border-border/60 bg-[linear-gradient(180deg,oklch(0.99_0.005_240),oklch(0.96_0.01_245))] p-6">
            <div className="flex items-center gap-3">
              {form.logo_url ? (
                <img
                  src={form.logo_url}
                  alt=""
                  className="h-14 w-14 rounded-2xl object-cover ring-1 ring-border"
                />
              ) : (
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary text-primary-foreground">
                  {form.name.trim().slice(0, 1).toUpperCase() || "S"}
                </div>
              )}
              <div>
                <div className="font-display text-xl font-semibold">{form.name || "School name"}</div>
                <div className="text-sm text-muted-foreground">/{schoolSlug}</div>
              </div>
            </div>
            {form.motto && (
              <p className="mt-5 text-sm uppercase tracking-[0.18em] text-brand">{form.motto}</p>
            )}
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              Families will search for published results here. Keep the name, logo, and motto clear
              so each school portal feels distinct.
            </p>
          </div>

          {settings.isLoading && <p className="mt-4 text-sm text-muted-foreground">Loading...</p>}
        </section>
      </div>
    </div>
  );
}
