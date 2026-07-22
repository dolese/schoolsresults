import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays } from "lucide-react";
import { ComingSoon } from "@/components/manage/ComingSoon";

export const Route = createFileRoute(
  "/_authenticated/manage/$schoolSlug/terms",
)({ component: Page });

function Page() {
  const { schoolSlug } = Route.useParams();
  return (
    <ComingSoon
      schoolSlug={schoolSlug}
      title={'Terms'}
      description={'Configure terms/semesters for the academic year.'}
      icon={CalendarDays}
    />
  );
}
