import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import {
  GraduationCap,
  ArrowRight,
  Eye,
  EyeOff,
  CheckCircle2,
  Rocket,
  Users,
  BarChart3,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { createSchool } from "@/lib/schools.functions";
import { slugify } from "@/lib/slug";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/signup")({
  ssr: false,
  head: () => ({ meta: [{ title: "Start your school - SchoolsResultsPortal" }] }),
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const createSchoolFn = useServerFn(createSchool);
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [alreadySignedIn, setAlreadySignedIn] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const [schoolName, setSchoolName] = useState("");
  const [slug, setSlug] = useState("");
  const [region, setRegion] = useState("");

  useEffect(() => {
    setSlug(slugify(schoolName));
  }, [schoolName]);

  // If the user is already authenticated (e.g. arrived from /app's
  // "New school" button), skip the account-creation step entirely.
  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!active || !data.user) return;
      setAlreadySignedIn(true);
      setEmail(data.user.email ?? "");
      setStep(2);
    })();
    return () => {
      active = false;
    };
  }, []);

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
    <div className="grid min-h-screen bg-background lg:grid-cols-2">
      {/* Brand panel */}
      <aside className="relative hidden overflow-hidden bg-primary text-primary-foreground lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.18]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 15% 15%, var(--color-brand) 0, transparent 40%), radial-gradient(circle at 85% 85%, var(--color-accent) 0, transparent 45%)",
          }}
        />
        <Link to="/" className="relative z-10 flex items-center gap-2">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand text-brand-foreground">
            <GraduationCap className="h-5 w-5" />
          </span>
          <span className="font-display text-lg font-semibold tracking-tight">
            SchoolsResultsPortal
          </span>
        </Link>

        <div className="relative z-10 max-w-md">
          <p className="text-[11px] uppercase tracking-[0.25em] text-primary-foreground/70">
            Launch in minutes
          </p>
          <h2 className="mt-4 font-display text-4xl leading-[1.05]">
            Your school's results portal — set up in under five minutes.
          </h2>
          <p className="mt-4 text-sm text-primary-foreground/75">
            Create your account, claim your portal URL, and start publishing
            transparent, beautiful results that parents and students can trust.
          </p>

          <ul className="mt-8 space-y-3 text-sm">
            <Feature icon={<Rocket className="h-4 w-4" />}>
              Free during pilot — no credit card required
            </Feature>
            <Feature icon={<Users className="h-4 w-4" />}>
              Unlimited students, classes, and subjects
            </Feature>
            <Feature icon={<BarChart3 className="h-4 w-4" />}>
              Exam analytics, divisions, and printable report cards
            </Feature>
          </ul>
        </div>

        <p className="relative z-10 text-xs text-primary-foreground/60">
          © {new Date().getFullYear()} SchoolsResultsPortal
        </p>
      </aside>

      {/* Form panel */}
      <main className="flex items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <Link to="/" className="mb-8 inline-flex items-center gap-2 lg:hidden">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground">
              <GraduationCap className="h-5 w-5" />
            </span>
            <span className="font-display font-semibold">SchoolsResultsPortal</span>
          </Link>

          <div className="mb-6">
            <span className="inline-flex items-center rounded-full border border-border/60 bg-secondary px-3 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-secondary-foreground">
              {alreadySignedIn
                ? "Add a school"
                : step === 1
                  ? "Step 1 of 2 · Account"
                  : "Step 2 of 2 · School"}
            </span>
            <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight">
              {step === 1 && !alreadySignedIn
                ? "Create your account"
                : "Tell us about your school"}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {step === 1 && !alreadySignedIn
                ? "You'll be the first administrator of your school portal."
                : "This becomes the public address parents will visit."}
            </p>
          </div>

          {!alreadySignedIn && (
          <div className="mb-6 flex items-center gap-2 text-xs">
          <span
            className={`flex h-6 w-6 items-center justify-center rounded-full ${
              step >= 1 ? "bg-brand text-brand-foreground" : "bg-muted"
            }`}
          >
            1
          </span>
            <span className={step >= 1 ? "font-medium text-foreground" : "text-muted-foreground"}>Account</span>
            <span className="mx-2 h-px flex-1 bg-border" />
          <span
            className={`flex h-6 w-6 items-center justify-center rounded-full ${
              step >= 2 ? "bg-brand text-brand-foreground" : "bg-muted"
            }`}
          >
            2
          </span>
            <span className={step >= 2 ? "font-medium text-foreground" : "text-muted-foreground"}>School</span>
          </div>
          )}

        {step === 1 ? (
          <>
            <form onSubmit={handleAccount} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Your name</Label>
                <Input
                  id="name"
                  required
                  autoFocus
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Mwakasege"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@school.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute inset-y-0 right-0 grid w-10 place-items-center text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-muted-foreground">Minimum 6 characters.</p>
              </div>
              <Button
                type="submit"
                disabled={loading}
                size="lg"
                className="group w-full bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {loading ? (
                  "Creating..."
                ) : (
                  <>
                    Continue
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="font-medium text-foreground hover:underline">
                Sign in
              </Link>
            </p>
          </>
        ) : (
          <>
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-border/60 bg-secondary/60 px-3 py-2 text-xs text-secondary-foreground">
              <CheckCircle2 className="h-3.5 w-3.5 text-brand" />
              Account created for <span className="font-mono">{email}</span>
            </div>
            <form onSubmit={handleSchool} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="schoolName">School name</Label>
                <Input
                  id="schoolName"
                  required
                  autoFocus
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
                <p className="text-[11px] text-muted-foreground">
                  Lowercase letters, numbers, and dashes only.
                </p>
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
              <div className="flex items-center gap-2">
                {!alreadySignedIn && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  disabled={loading}
                >
                  Back
                </Button>
                )}
                <Button
                  type="submit"
                  disabled={loading}
                  size="lg"
                  className="group flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {loading ? (
                    "Creating school..."
                  ) : (
                    <>
                      Create school portal
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </>
        )}

          <p className="mt-8 text-center text-xs text-muted-foreground">
            By continuing you agree to our terms and privacy policy.
          </p>
        </div>
      </main>
    </div>
  );
}

function Feature({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-3 text-primary-foreground/85">
      <span className="grid h-7 w-7 place-items-center rounded-md bg-white/10 text-brand">
        {icon}
      </span>
      {children}
    </li>
  );
}
