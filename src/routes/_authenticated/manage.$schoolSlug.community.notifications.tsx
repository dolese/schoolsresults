import { createFileRoute } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import { ComingSoon } from "@/components/manage/ComingSoon";

export const Route = createFileRoute(
  "/_authenticated/manage/$schoolSlug/community/notifications",
)({ component: Page });

function Page() {
  const { schoolSlug } = Route.useParams();
  return (
    <ComingSoon
      schoolSlug={schoolSlug}
      title={'Notifications'}
      description={'In-app broadcasts to portal users.'}
      icon={Bell}
    />
  );
}
