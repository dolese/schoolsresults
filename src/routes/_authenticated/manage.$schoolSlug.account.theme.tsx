import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Sun, Moon, Monitor, Palette } from "lucide-react";

export const Route = createFileRoute("/_authenticated/manage/$schoolSlug/account/theme")({ component: Page });

type Mode = "light" | "dark" | "system";

function applyTheme(mode: Mode) {
  const root = document.documentElement;
  const isDark = mode === "dark" || (mode === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  root.classList.toggle("dark", isDark);
  localStorage.setItem("theme", mode);
}

function Page() {
  const [mode, setMode] = useState<Mode>("system");
  useEffect(() => {
    const saved = (localStorage.getItem("theme") as Mode | null) ?? "system";
    setMode(saved);
  }, []);
  const choose = (m: Mode) => { setMode(m); applyTheme(m); };
  const options: { key: Mode; label: string; icon: typeof Sun }[] = [
    { key: "light", label: "Light", icon: Sun },
    { key: "dark", label: "Dark", icon: Moon },
    { key: "system", label: "System", icon: Monitor },
  ];

  return (
    <div className="p-6 md:p-10">
      <div className="mb-6 flex items-center gap-3">
        <Palette className="h-5 w-5 text-muted-foreground" />
        <div>
          <h1 className="font-display text-2xl font-semibold">Theme</h1>
          <p className="text-sm text-muted-foreground">Choose how the dashboard looks.</p>
        </div>
      </div>
      <div className="grid max-w-2xl gap-3 sm:grid-cols-3">
        {options.map((o) => (
          <button key={o.key} onClick={() => choose(o.key)} className={`rounded-2xl border p-5 text-left transition ${mode === o.key ? "border-primary bg-primary/5" : "border-border/60 bg-card hover:bg-muted/40"}`}>
            <o.icon className="h-5 w-5 text-primary" />
            <div className="mt-3 font-display text-lg font-semibold">{o.label}</div>
            <div className="text-xs text-muted-foreground">{o.key === "system" ? "Match OS preference" : `Always ${o.key}`}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
