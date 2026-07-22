import { createFileRoute } from "@tanstack/react-router";
import { Send } from "lucide-react";
import { ComingSoon } from "@/components/manage/ComingSoon";

export const Route = createFileRoute(
  "/_authenticated/manage/$schoolSlug/assessment/publish",
)({ component: Page });

function Page() {
  const { schoolSlug } = Route.useParams();
  return (
    <ComingSoon
      schoolSlug={schoolSlug}
      title={'Publish results'}
      description={'Batch publish or unpublish exams with confirmation.'}
      icon={Send}
    />
  );
}
