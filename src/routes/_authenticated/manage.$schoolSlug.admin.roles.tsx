import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { ComingSoon } from "@/components/manage/ComingSoon";

export const Route = createFileRoute(
  "/_authenticated/manage/$schoolSlug/admin/roles",
)({ component: Page });

function Page() {
  const { schoolSlug } = Route.useParams();
  return (
    <ComingSoon
      schoolSlug={schoolSlug}
      title={'Roles & permissions'}
      description={'Fine-grained roles: admin, teacher, class teacher, viewer.'}
      icon={ShieldCheck}
    />
  );
}
