import { createFileRoute } from "@tanstack/react-router";
import { MessageSquare } from "lucide-react";
import { ComingSoon } from "@/components/manage/ComingSoon";

export const Route = createFileRoute(
  "/_authenticated/manage/$schoolSlug/community/sms",
)({ component: Page });

function Page() {
  const { schoolSlug } = Route.useParams();
  return (
    <ComingSoon
      schoolSlug={schoolSlug}
      title={'SMS'}
      description={'Send SMS alerts to parents and staff.'}
      icon={MessageSquare}
    />
  );
}
