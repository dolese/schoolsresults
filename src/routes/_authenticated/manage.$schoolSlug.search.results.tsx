import { createFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { ComingSoon } from "@/components/manage/ComingSoon";

export const Route = createFileRoute(
  "/_authenticated/manage/$schoolSlug/search/results",
)({ component: Page });

function Page() {
  const { schoolSlug } = Route.useParams();
  return (
    <ComingSoon
      schoolSlug={schoolSlug}
      title={'Find results'}
      description={'Deep search over marks, exams, and divisions.'}
      icon={Search}
    />
  );
}
