import { createFileRoute } from "@tanstack/react-router";
import { UserCircle2 } from "lucide-react";
import { ComingSoon } from "@/components/manage/ComingSoon";

export const Route = createFileRoute(
  "/_authenticated/manage/$schoolSlug/students/profiles",
)({ component: Page });

function Page() {
  const { schoolSlug } = Route.useParams();
  return (
    <ComingSoon
      schoolSlug={schoolSlug}
      title={'Student profiles'}
      description={'Detailed student profiles with photo, guardian info, and history.'}
      icon={UserCircle2}
    />
  );
}
