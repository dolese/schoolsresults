import { createFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { ComingSoon } from "@/components/manage/ComingSoon";

export const Route = createFileRoute(
  "/_authenticated/manage/$schoolSlug/search/advanced",
)({ component: Page });

function Page() {
  const { schoolSlug } = Route.useParams();
  return (
    <ComingSoon
      schoolSlug={schoolSlug}
      title={'Advanced search'}
      description={'Combine filters for staff, students, subjects, and exams.'}
      icon={Search}
    />
  );
}
