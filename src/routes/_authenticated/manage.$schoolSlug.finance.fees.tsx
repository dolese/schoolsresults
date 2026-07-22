import { createFileRoute } from "@tanstack/react-router";
import { Wallet } from "lucide-react";
import { ComingSoon } from "@/components/manage/ComingSoon";

export const Route = createFileRoute(
  "/_authenticated/manage/$schoolSlug/finance/fees",
)({ component: Page });

function Page() {
  const { schoolSlug } = Route.useParams();
  return (
    <ComingSoon
      schoolSlug={schoolSlug}
      title={'Fee status'}
      description={'Student fee status, balances, and installment plans.'}
      icon={Wallet}
    />
  );
}
