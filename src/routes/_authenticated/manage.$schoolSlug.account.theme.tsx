import { createFileRoute } from "@tanstack/react-router";
import { Palette } from "lucide-react";
import { ComingSoon } from "@/components/manage/ComingSoon";

export const Route = createFileRoute(
  "/_authenticated/manage/$schoolSlug/account/theme",
)({ component: Page });

function Page() {
  const { schoolSlug } = Route.useParams();
  return (
    <ComingSoon
      schoolSlug={schoolSlug}
      title={'Theme'}
      description={'Personalize the dashboard theme and density.'}
      icon={Palette}
    />
  );
}
