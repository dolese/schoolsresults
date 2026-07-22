import { createFileRoute } from "@tanstack/react-router";
import { School } from "lucide-react";
import { ComingSoon } from "@/components/manage/ComingSoon";

export const Route = createFileRoute(
  "/_authenticated/manage/$schoolSlug/reports/school",
)({ component: Page });

function Page() {
  const { schoolSlug } = Route.useParams();
  return (
    <ComingSoon
      schoolSlug={schoolSlug}
      title={'School performance'}
      description={'Overall school KPIs, trends, and historical comparisons.'}
      icon={School}
    />
  );
}
