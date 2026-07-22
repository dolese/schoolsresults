import { createFileRoute } from "@tanstack/react-router";
import { Trophy } from "lucide-react";
import { ComingSoon } from "@/components/manage/ComingSoon";

export const Route = createFileRoute(
  "/_authenticated/manage/$schoolSlug/reports/necta",
)({ component: Page });

function Page() {
  const { schoolSlug } = Route.useParams();
  return (
    <ComingSoon
      schoolSlug={schoolSlug}
      title={'NECTA analysis'}
      description={'Division distribution and points analysis aligned with NECTA standards.'}
      icon={Trophy}
    />
  );
}
