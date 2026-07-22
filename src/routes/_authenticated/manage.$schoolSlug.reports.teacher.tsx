import { createFileRoute } from "@tanstack/react-router";
import { UserCheck } from "lucide-react";
import { ComingSoon } from "@/components/manage/ComingSoon";

export const Route = createFileRoute(
  "/_authenticated/manage/$schoolSlug/reports/teacher",
)({ component: Page });

function Page() {
  const { schoolSlug } = Route.useParams();
  return (
    <ComingSoon
      schoolSlug={schoolSlug}
      title={'Teacher performance'}
      description={'Teacher-level performance based on assigned subjects and classes.'}
      icon={UserCheck}
    />
  );
}
