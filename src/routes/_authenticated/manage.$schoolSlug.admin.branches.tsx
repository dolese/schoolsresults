import { createFileRoute } from "@tanstack/react-router";
import { Building2 } from "lucide-react";
import { ComingSoon } from "@/components/manage/ComingSoon";

export const Route = createFileRoute(
  "/_authenticated/manage/$schoolSlug/admin/branches",
)({ component: Page });

function Page() {
  const { schoolSlug } = Route.useParams();
  return (
    <ComingSoon
      schoolSlug={schoolSlug}
      title={'Branches / campuses'}
      description={'Multi-campus support for schools with multiple sites.'}
      icon={Building2}
    />
  );
}
