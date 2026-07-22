import { createFileRoute } from "@tanstack/react-router";
import { ScrollText } from "lucide-react";
import { ComingSoon } from "@/components/manage/ComingSoon";

export const Route = createFileRoute(
  "/_authenticated/manage/$schoolSlug/docs/certificates",
)({ component: Page });

function Page() {
  const { schoolSlug } = Route.useParams();
  return (
    <ComingSoon
      schoolSlug={schoolSlug}
      title={'Certificates'}
      description={'Generate leaving and completion certificates.'}
      icon={ScrollText}
    />
  );
}
