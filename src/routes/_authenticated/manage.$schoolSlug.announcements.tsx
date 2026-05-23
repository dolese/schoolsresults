import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Pencil, Trash2, Megaphone } from "lucide-react";
import { toast } from "sonner";
import {
  listAnnouncements,
  upsertAnnouncement,
  deleteAnnouncement,
} from "@/lib/announcements.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute(
  "/_authenticated/manage/$schoolSlug/announcements",
)({ component: AnnouncementsPage });

type Announcement = {
  id: string;
  title: string;
  body: string;
  published_at: string;
};

function AnnouncementsPage() {
  const { schoolSlug } = Route.useParams();
  const qc = useQueryClient();
  const fetchList = useServerFn(listAnnouncements);
  const upsertFn = useServerFn(upsertAnnouncement);
  const deleteFn = useServerFn(deleteAnnouncement);

  const { data, isLoading } = useQuery({
    queryKey: ["announcements", schoolSlug],
    queryFn: () => fetchList({ data: { slug: schoolSlug } }),
  });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  function openNew() {
    setEditing(null);
    setTitle("");
    setBody("");
    setOpen(true);
  }
  function openEdit(a: Announcement) {
    setEditing(a);
    setTitle(a.title);
    setBody(a.body);
    setOpen(true);
  }

  const save = useMutation({
    mutationFn: () =>
      upsertFn({
        data: { slug: schoolSlug, id: editing?.id ?? null, title, body },
      }),
    onSuccess: () => {
      toast.success(editing ? "Announcement updated" : "Announcement posted");
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["announcements", schoolSlug] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) =>
      deleteFn({ data: { slug: schoolSlug, id } }),
    onSuccess: () => {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["announcements", schoolSlug] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const list = (data?.announcements ?? []) as Announcement[];

  return (
    <div className="p-6 md:p-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">Announcements</h1>
          <p className="text-sm text-muted-foreground">
            Posted on your public school portal.
          </p>
        </div>
        <Button onClick={openNew}>
          <Plus className="mr-2 h-4 w-4" /> New announcement
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : list.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/60 p-10 text-center">
          <Megaphone className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No announcements yet. Post one to greet students and parents.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {list.map((a) => (
            <article
              key={a.id}
              className="rounded-2xl border border-border/60 bg-card p-5"
            >
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <div className="text-xs text-muted-foreground">
                    {new Date(a.published_at).toLocaleDateString()}
                  </div>
                  <h3 className="mt-1 font-semibold">{a.title}</h3>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => openEdit(a)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      if (confirm("Delete this announcement?"))
                        remove.mutate(a.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
                {a.body}
              </p>
            </article>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit announcement" : "New announcement"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Title</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Form IV mock results released"
              />
            </div>
            <div>
              <Label>Body</Label>
              <Textarea
                rows={6}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write the announcement…"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => save.mutate()}
              disabled={save.isPending || title.length < 2 || body.length < 2}
            >
              {editing ? "Save" : "Post"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}