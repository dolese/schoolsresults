import { createFileRoute } from "@tanstack/react-router";
import { CalendarRange } from "lucide-react";
import { ComingSoon } from "@/components/manage/ComingSoon";

export const Route = createFileRoute(
  "/_authenticated/manage/$schoolSlug/years",
)({ component: Page });

function Page() {
  const { schoolSlug } = Route.useParams();
  return (
    <ComingSoon
      schoolSlug={schoolSlug}
      title={'Academic years'}
      description={'Configure academic years, current year, and archives.'}
      icon={CalendarRange}
    />
  );
}
