import { createFileRoute } from "@tanstack/react-router";
import { Building2 } from "lucide-react";
import { ComingSoon } from "@/components/manage/ComingSoon";

export const Route = createFileRoute(
  "/_authenticated/manage/$schoolSlug/staff/departments",
)({ component: Page });

function Page() {
  const { schoolSlug } = Route.useParams();
  return (
    <ComingSoon
      schoolSlug={schoolSlug}
      title={'Departments'}
      description={'Group subjects into departments (Sciences, Languages, etc.).'}
      icon={Building2}
    />
  );
}
