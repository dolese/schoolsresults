import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { KeySquare } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/manage/$schoolSlug/account/password")({
  component: PasswordPage,
});

function PasswordPage() {
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);

  async function update() {
    if (pw.length < 8) return toast.error("Password must be at least 8 characters");
    if (pw !== confirm) return toast.error("Passwords do not match");
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setSaving(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Password updated");
      setPw("");
      setConfirm("");
    }
  }

  return (
    <div className="p-6 md:p-10">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold flex items-center gap-2">
          <KeySquare className="h-5 w-5" /> Change password
        </h1>
        <p className="text-sm text-muted-foreground">Use a strong password unique to this account.</p>
      </div>
      <div className="max-w-lg space-y-4 rounded-2xl border border-border/60 bg-card p-6">
        <div>
          <Label>New password</Label>
          <Input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="At least 8 characters" />
        </div>
        <div>
          <Label>Confirm new password</Label>
          <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </div>
        <Button onClick={update} disabled={saving}>
          {saving ? "Updating…" : "Update password"}
        </Button>
      </div>
    </div>
  );
}
