import { createFileRoute } from "@tanstack/react-router";
import { Mail } from "lucide-react";
import { ComingSoon } from "@/components/manage/ComingSoon";

export const Route = createFileRoute(
  "/_authenticated/manage/$schoolSlug/community/email",
)({ component: Page });

function Page() {
  const { schoolSlug } = Route.useParams();
  return (
    <ComingSoon
      schoolSlug={schoolSlug}
      title={'Email'}
      description={'Broadcast emails to staff, students, and parents.'}
      icon={Mail}
    />
  );
}
