import { createFileRoute } from "@tanstack/react-router";
import { History } from "lucide-react";
import { ComingSoon } from "@/components/manage/ComingSoon";

export const Route = createFileRoute(
  "/_authenticated/manage/$schoolSlug/assessment/history",
)({ component: Page });

function Page() {
  const { schoolSlug } = Route.useParams();
  return (
    <ComingSoon
      schoolSlug={schoolSlug}
      title={'Result history'}
      description={'Historical record of publish/unpublish and mark edits.'}
      icon={History}
    />
  );
}
