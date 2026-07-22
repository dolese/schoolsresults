import { createFileRoute } from "@tanstack/react-router";
import { UserPlus } from "lucide-react";
import { ComingSoon } from "@/components/manage/ComingSoon";

export const Route = createFileRoute(
  "/_authenticated/manage/$schoolSlug/students/admission",
)({ component: Page });

function Page() {
  const { schoolSlug } = Route.useParams();
  return (
    <ComingSoon
      schoolSlug={schoolSlug}
      title={'Admission'}
      description={'New student admission workflow with intake forms and approvals.'}
      icon={UserPlus}
    />
  );
}
