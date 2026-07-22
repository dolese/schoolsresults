import { createFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { ComingSoon } from "@/components/manage/ComingSoon";

export const Route = createFileRoute(
  "/_authenticated/manage/$schoolSlug/search/student",
)({ component: Page });

function Page() {
  const { schoolSlug } = Route.useParams();
  return (
    <ComingSoon
      schoolSlug={schoolSlug}
      title={'Find student'}
      description={'Powerful student search across forms, years, and streams.'}
      icon={Search}
    />
  );
}
