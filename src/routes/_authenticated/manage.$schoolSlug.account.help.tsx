import { createFileRoute } from "@tanstack/react-router";
import { LifeBuoy, BookOpen, MessageSquare, Mail } from "lucide-react";

export const Route = createFileRoute("/_authenticated/manage/$schoolSlug/account/help")({
  component: HelpPage,
});

function HelpPage() {
  const items = [
    { icon: BookOpen, title: "Getting started", body: "Set up forms, subjects, and your first exam in under 15 minutes." },
    { icon: MessageSquare, title: "Ask the team", body: "Reach us on WhatsApp or email — most replies within a working day." },
    { icon: Mail, title: "support@schoolsresults.app", body: "For billing, invoicing, or feature requests." },
  ];
  return (
    <div className="p-6 md:p-10">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold flex items-center gap-2">
          <LifeBuoy className="h-5 w-5" /> Help & support
        </h1>
        <p className="text-sm text-muted-foreground">We're here to help your school run smoothly.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {items.map((i) => (
          <div key={i.title} className="rounded-2xl border border-border/60 bg-card p-5">
            <div className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
              <i.icon className="h-5 w-5" />
            </div>
            <h3 className="font-semibold">{i.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{i.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
