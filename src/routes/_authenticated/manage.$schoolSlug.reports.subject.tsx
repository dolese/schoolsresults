import { createFileRoute } from "@tanstack/react-router";
import { PieChart } from "lucide-react";
import { ComingSoon } from "@/components/manage/ComingSoon";

export const Route = createFileRoute(
  "/_authenticated/manage/$schoolSlug/reports/subject",
)({ component: Page });

function Page() {
  const { schoolSlug } = Route.useParams();
  return (
    <ComingSoon
      schoolSlug={schoolSlug}
      title={'Subject analysis'}
      description={'Subject-level analytics: mean, deviation, and grade distribution.'}
      icon={PieChart}
    />
  );
}
