import { createFileRoute } from "@tanstack/react-router";
import { FileSpreadsheet } from "lucide-react";
import { ComingSoon } from "@/components/manage/ComingSoon";

export const Route = createFileRoute(
  "/_authenticated/manage/$schoolSlug/assessment/import",
)({ component: Page });

function Page() {
  const { schoolSlug } = Route.useParams();
  return (
    <ComingSoon
      schoolSlug={schoolSlug}
      title={'Bulk import marks'}
      description={'Dedicated XLSX/CSV mark import center with validation and audit trail.'}
      icon={FileSpreadsheet}
    />
  );
}
