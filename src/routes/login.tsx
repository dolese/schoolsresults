import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import {
  GraduationCap,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  LineChart,
  Sparkles,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getMySchools } from "@/lib/schools.functions";
import { getPostLoginPath, normalizeInternalRedirect } from "@/lib/post-login";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
  }),
  head: () => ({ meta: [{ title: "Log in - SchoolsResultsPortal" }] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const fetchMySchools = useServerFn(getMySchools);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // If already authenticated, skip the form and go to the right place.
  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!active || !data.user) return;
      const redirectPath = normalizeInternalRedirect(search.redirect);
      if (redirectPath) {
        navigate({ href: redirectPath, replace: true } as never);
        return;
      }
      try {
        const mine = await fetchMySchools();
        navigate({ href: getPostLoginPath(mine), replace: true } as never);
      } catch {
        navigate({ to: "/app", replace: true });
      }
    })();
    return () => {
      active = false;
    };
  }, [fetchMySchools, navigate, search.redirect]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoading(false);
      toast.error(error.message);
      return;
    }

    try {
      const redirectPath = normalizeInternalRedirect(search.redirect);
      if (redirectPath) {
        toast.success("Welcome back!");
        navigate({ href: redirectPath, replace: true } as never);
        return;
      }

      const mySchools = await fetchMySchools();
      toast.success("Welcome back!");
      navigate({ href: getPostLoginPath(mySchools), replace: true } as never);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not finish sign-in");
    } finally {
      setLoading(false);
    }
  }

  const redirectNotice = normalizeInternalRedirect(search.redirect);

  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-2">
      {/* Brand / editorial panel */}
      <aside className="relative hidden overflow-hidden bg-primary text-primary-foreground lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.18]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 10%, var(--color-brand) 0, transparent 40%), radial-gradient(circle at 90% 80%, var(--color-accent) 0, transparent 45%)",
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
            Trusted results infrastructure
          </p>
          <h2 className="mt-4 font-display text-4xl leading-[1.05]">
            Run your school's results — clearly, fairly, beautifully.
          </h2>
          <p className="mt-4 text-sm text-primary-foreground/75">
            One portal for marks, analytics, report cards, and the public
            leaderboard. Parents see what matters. Teachers move faster.
          </p>

          <ul className="mt-8 space-y-3 text-sm">
            <Feature icon={<ShieldCheck className="h-4 w-4" />}>
              Role-based access, RLS-secured data
            </Feature>
            <Feature icon={<LineChart className="h-4 w-4" />}>
              Per-student progress trends and exam analytics
            </Feature>
            <Feature icon={<Sparkles className="h-4 w-4" />}>
              Bulk report cards ready for print, every term
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
          <Link
            to="/"
            className="mb-8 inline-flex items-center gap-2 lg:hidden"
          >
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground">
              <GraduationCap className="h-5 w-5" />
            </span>
            <span className="font-display font-semibold">SchoolsResultsPortal</span>
          </Link>

          <div className="mb-6">
            <span className="inline-flex items-center rounded-full border border-border/60 bg-secondary px-3 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-secondary-foreground">
              Sign in
            </span>
            <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight">
              Welcome back
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Continue managing your school portal.
            </p>
          </div>

          {redirectNotice && (
            <div className="mb-5 rounded-lg border border-border/60 bg-secondary/60 px-3 py-2 text-xs text-secondary-foreground">
              You'll be returned to{" "}
              <span className="font-mono text-foreground">{redirectNotice}</span>{" "}
              after signing in.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                autoFocus
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@school.com"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <button
                  type="button"
                  onClick={() => toast.info("Contact your administrator to reset your password.")}
                  className="text-xs font-medium text-accent hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
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
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="group w-full bg-primary text-primary-foreground hover:bg-primary/90"
              size="lg"
            >
              {loading ? (
                "Signing in..."
              ) : (
                <>
                  Sign in
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </Button>
          </form>

          <div className="my-6 flex items-center gap-3 text-[11px] uppercase tracking-widest text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            <span>New to the portal?</span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <Link
            to="/signup"
            className="flex w-full items-center justify-center rounded-md border border-input bg-background px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
          >
            Start your school portal
          </Link>

          <p className="mt-8 text-center text-xs text-muted-foreground">
            By signing in you agree to our terms and acknowledge our privacy policy.
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
