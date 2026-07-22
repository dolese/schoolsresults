import { createFileRoute } from "@tanstack/react-router";
import { UserCheck } from "lucide-react";
import { ComingSoon } from "@/components/manage/ComingSoon";

export const Route = createFileRoute(
  "/_authenticated/manage/$schoolSlug/staff/class-teachers",
)({ component: Page });

function Page() {
  const { schoolSlug } = Route.useParams();
  return (
    <ComingSoon
      schoolSlug={schoolSlug}
      title={'Class teachers'}
      description={'Assign class teachers to forms and streams.'}
      icon={UserCheck}
    />
  );
}
