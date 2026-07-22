import { createFileRoute } from "@tanstack/react-router";
import { Printer } from "lucide-react";
import { ComingSoon } from "@/components/manage/ComingSoon";

export const Route = createFileRoute(
  "/_authenticated/manage/$schoolSlug/docs/print",
)({ component: Page });

function Page() {
  const { schoolSlug } = Route.useParams();
  return (
    <ComingSoon
      schoolSlug={schoolSlug}
      title={'Print center'}
      description={'Bulk-print report cards, certificates, and testimonials.'}
      icon={Printer}
    />
  );
}
