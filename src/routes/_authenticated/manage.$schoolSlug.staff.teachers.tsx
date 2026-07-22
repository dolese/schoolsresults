import { createFileRoute } from "@tanstack/react-router";
import { Presentation } from "lucide-react";
import { ComingSoon } from "@/components/manage/ComingSoon";

export const Route = createFileRoute(
  "/_authenticated/manage/$schoolSlug/staff/teachers",
)({ component: Page });

function Page() {
  const { schoolSlug } = Route.useParams();
  return (
    <ComingSoon
      schoolSlug={schoolSlug}
      title={'Teachers'}
      description={'Full teacher directory with subjects, forms, and contact info.'}
      icon={Presentation}
    />
  );
}
