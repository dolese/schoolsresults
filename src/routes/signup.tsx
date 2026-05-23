import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { GraduationCap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { createSchool } from "@/lib/schools.functions";
import { slugify } from "@/lib/slug";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Start your school - SchoolsResultsPortal" }] }),
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const createSchoolFn = useServerFn(createSchool);
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const [schoolName, setSchoolName] = useState("");
  const [slug, setSlug] = useState("");
  const [region, setRegion] = useState("");

  useEffect(() => {
    setSlug(slugify(schoolName));
  }, [schoolName]);

  async function handleAccount(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const { data: existing } = await supabase.auth.getSession();
    if (!existing.session) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin, data: { full_name: name } },
      });
      if (error) {
        setLoading(false);
        toast.error(error.message);
        return;
      }

      const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
      if (signInErr) {
        setLoading(false);
        toast.error("Account created, but please verify your email to continue.");
        return;
      }
    }

    setLoading(false);
    setStep(2);
  }

  async function handleSchool(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await createSchoolFn({
        data: { slug, name: schoolName, region: region || null, motto: null },
      });
      toast.success("School created!");
      navigate({ to: "/manage/$schoolSlug", params: { schoolSlug: res.slug } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create school");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-background px-4 py-12">
      <div className="w-full max-w-lg rounded-3xl border border-border/60 bg-card p-8 shadow-xl">
        <Link to="/" className="mb-6 flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground">
            <GraduationCap className="h-5 w-5" />
          </span>
          <span className="font-display font-semibold">SchoolsResultsPortal</span>
        </Link>
        <div className="mb-6 flex items-center gap-2 text-xs">
          <span
            className={`flex h-6 w-6 items-center justify-center rounded-full ${
              step >= 1 ? "bg-brand text-brand-foreground" : "bg-muted"
            }`}
          >
            1
          </span>
          <span className="text-muted-foreground">Account</span>
          <span className="mx-2 h-px flex-1 bg-border" />
          <span
            className={`flex h-6 w-6 items-center justify-center rounded-full ${
              step >= 2 ? "bg-brand text-brand-foreground" : "bg-muted"
            }`}
          >
            2
          </span>
          <span className="text-muted-foreground">School</span>
        </div>

        {step === 1 ? (
          <>
            <h1 className="font-display text-2xl font-semibold">Create your account</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              You will be the first administrator of your school portal.
            </p>
            <form onSubmit={handleAccount} className="mt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Your name</Label>
                <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-brand text-brand-foreground hover:bg-brand/90"
              >
                {loading ? "Creating..." : "Continue"}
              </Button>
            </form>
          </>
        ) : (
          <>
            <h1 className="font-display text-2xl font-semibold">Tell us about your school</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              This becomes your public results portal.
            </p>
            <form onSubmit={handleSchool} className="mt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="schoolName">School name</Label>
                <Input
                  id="schoolName"
                  required
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  placeholder="e.g. Bonde Secondary School"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Portal URL</Label>
                <div className="flex items-center rounded-md border border-input bg-background">
                  <span className="px-3 text-sm text-muted-foreground">schoolsresults.app/</span>
                  <Input
                    id="slug"
                    required
                    pattern="^[a-z0-9](-?[a-z0-9])*$"
                    minLength={3}
                    maxLength={40}
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase())}
                    className="border-0 focus-visible:ring-0"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="region">Region (optional)</Label>
                <Input
                  id="region"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  placeholder="e.g. Mbeya"
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-brand text-brand-foreground hover:bg-brand/90"
              >
                {loading ? "Creating school..." : "Create school portal"}
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
