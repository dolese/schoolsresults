import { createFileRoute } from "@tanstack/react-router";
import { Award } from "lucide-react";
import { ComingSoon } from "@/components/manage/ComingSoon";

export const Route = createFileRoute(
  "/_authenticated/manage/$schoolSlug/results",
)({ component: Page });

function Page() {
  const { schoolSlug } = Route.useParams();
  return (
    <ComingSoon
      schoolSlug={schoolSlug}
      title={'Results overview'}
      description={'High-level view of exam results across forms and academic years.'}
      icon={Award}
    />
  );
}
