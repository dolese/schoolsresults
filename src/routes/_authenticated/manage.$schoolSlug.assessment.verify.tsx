import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { ComingSoon } from "@/components/manage/ComingSoon";

export const Route = createFileRoute(
  "/_authenticated/manage/$schoolSlug/assessment/verify",
)({ component: Page });

function Page() {
  const { schoolSlug } = Route.useParams();
  return (
    <ComingSoon
      schoolSlug={schoolSlug}
      title={'Verify results'}
      description={'Reviewer workflow to sign off on marks before publishing.'}
      icon={CheckCircle2}
    />
  );
}
