import { createFileRoute } from "@tanstack/react-router";
import { Files } from "lucide-react";
import { ComingSoon } from "@/components/manage/ComingSoon";

export const Route = createFileRoute(
  "/_authenticated/manage/$schoolSlug/docs/templates",
)({ component: Page });

function Page() {
  const { schoolSlug } = Route.useParams();
  return (
    <ComingSoon
      schoolSlug={schoolSlug}
      title={'Report templates'}
      description={'Configure branded report card and document templates.'}
      icon={Files}
    />
  );
}
