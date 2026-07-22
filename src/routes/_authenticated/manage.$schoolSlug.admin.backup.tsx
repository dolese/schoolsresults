import { createFileRoute } from "@tanstack/react-router";
import { DatabaseBackup } from "lucide-react";
import { ComingSoon } from "@/components/manage/ComingSoon";

export const Route = createFileRoute(
  "/_authenticated/manage/$schoolSlug/admin/backup",
)({ component: Page });

function Page() {
  const { schoolSlug } = Route.useParams();
  return (
    <ComingSoon
      schoolSlug={schoolSlug}
      title={'Backup & restore'}
      description={'Export and restore school data snapshots.'}
      icon={DatabaseBackup}
    />
  );
}
