import { createFileRoute } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import { ComingSoon } from "@/components/manage/ComingSoon";

export const Route = createFileRoute(
  "/_authenticated/manage/$schoolSlug/notifications",
)({ component: Page });

function Page() {
  const { schoolSlug } = Route.useParams();
  return (
    <ComingSoon
      schoolSlug={schoolSlug}
      title={'Notifications'}
      description={'In-app notifications for staff about exams, marks entry deadlines, and result publishing.'}
      icon={Bell}
    />
  );
}
