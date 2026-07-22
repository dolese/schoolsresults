import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { UserCircle2, Save } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/manage/$schoolSlug/account/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      setEmail(data.user?.email ?? "");
      setDisplayName(
        (data.user?.user_metadata as { display_name?: string } | undefined)?.display_name ?? "",
      );
      setLoading(false);
    })();
  }, []);

  async function save() {
    setSaving(true);
    const { error } = await supabase.auth.updateUser({
      data: { display_name: displayName },
    });
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Profile updated");
  }

  return (
    <div className="p-6 md:p-10">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold flex items-center gap-2">
          <UserCircle2 className="h-5 w-5" /> My profile
        </h1>
        <p className="text-sm text-muted-foreground">Update your personal information.</p>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <div className="max-w-lg space-y-4 rounded-2xl border border-border/60 bg-card p-6">
          <div>
            <Label>Email</Label>
            <Input value={email} disabled />
            <p className="mt-1 text-xs text-muted-foreground">Contact support to change your email.</p>
          </div>
          <div>
            <Label>Display name</Label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your full name"
            />
          </div>
          <Button onClick={save} disabled={saving}>
            <Save className="mr-2 h-4 w-4" /> {saving ? "Saving…" : "Save changes"}
          </Button>
        </div>
      )}
    </div>
  );
}
