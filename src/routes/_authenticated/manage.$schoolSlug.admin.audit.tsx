import { createFileRoute } from "@tanstack/react-router";
import { History } from "lucide-react";
import { ComingSoon } from "@/components/manage/ComingSoon";

export const Route = createFileRoute(
  "/_authenticated/manage/$schoolSlug/admin/audit",
)({ component: Page });

function Page() {
  const { schoolSlug } = Route.useParams();
  return (
    <ComingSoon
      schoolSlug={schoolSlug}
      title={'Audit logs'}
      description={'Immutable audit trail of admin and staff actions.'}
      icon={History}
    />
  );
}
