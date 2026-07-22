import { createFileRoute } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { ComingSoon } from "@/components/manage/ComingSoon";

export const Route = createFileRoute(
  "/_authenticated/manage/$schoolSlug/assessment/locks",
)({ component: Page });

function Page() {
  const { schoolSlug } = Route.useParams();
  return (
    <ComingSoon
      schoolSlug={schoolSlug}
      title={'Lock / unlock results'}
      description={'Freeze results once published; unlock requires admin approval.'}
      icon={Lock}
    />
  );
}
