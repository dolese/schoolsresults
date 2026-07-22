import { createFileRoute } from "@tanstack/react-router";
import { KeyRound } from "lucide-react";
import { ComingSoon } from "@/components/manage/ComingSoon";

export const Route = createFileRoute(
  "/_authenticated/manage/$schoolSlug/admin/api-keys",
)({ component: Page });

function Page() {
  const { schoolSlug } = Route.useParams();
  return (
    <ComingSoon
      schoolSlug={schoolSlug}
      title={'API keys'}
      description={'Programmatic access for integrations (read-only or scoped).'}
      icon={KeyRound}
    />
  );
}
