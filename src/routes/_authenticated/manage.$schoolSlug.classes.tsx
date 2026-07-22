import { createFileRoute } from "@tanstack/react-router";
import { Layers } from "lucide-react";
import { ComingSoon } from "@/components/manage/ComingSoon";

export const Route = createFileRoute(
  "/_authenticated/manage/$schoolSlug/classes",
)({ component: Page });

function Page() {
  const { schoolSlug } = Route.useParams();
  return (
    <ComingSoon
      schoolSlug={schoolSlug}
      title={'Classes & streams'}
      description={'Manage class streams (e.g. Form 4A, Form 4B) and assign teachers.'}
      icon={Layers}
    />
  );
}
