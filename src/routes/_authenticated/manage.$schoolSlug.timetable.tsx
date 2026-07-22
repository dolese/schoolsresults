import { createFileRoute } from "@tanstack/react-router";
import { Clock } from "lucide-react";
import { ComingSoon } from "@/components/manage/ComingSoon";

export const Route = createFileRoute(
  "/_authenticated/manage/$schoolSlug/timetable",
)({ component: Page });

function Page() {
  const { schoolSlug } = Route.useParams();
  return (
    <ComingSoon
      schoolSlug={schoolSlug}
      title={'Timetable'}
      description={'Weekly timetable per class and teacher.'}
      icon={Clock}
    />
  );
}
