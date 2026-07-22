import { createFileRoute } from "@tanstack/react-router";
import { LineChart } from "lucide-react";
import { ComingSoon } from "@/components/manage/ComingSoon";

export const Route = createFileRoute(
  "/_authenticated/manage/$schoolSlug/reports/gender",
)({ component: Page });

function Page() {
  const { schoolSlug } = Route.useParams();
  return (
    <ComingSoon
      schoolSlug={schoolSlug}
      title={'Gender analysis'}
      description={'Performance breakdown by gender across forms and exams.'}
      icon={LineChart}
    />
  );
}
