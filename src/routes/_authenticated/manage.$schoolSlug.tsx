import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getManageOverview } from "@/lib/manage.functions";
import { ManageShell } from "@/components/manage/ManageShell";

export const Route = createFileRoute("/_authenticated/manage/$schoolSlug")({
  component: ManageLayout,
});

function ManageLayout() {
  const { schoolSlug } = Route.useParams();
  const fetchOverview = useServerFn(getManageOverview);
  const { data } = useQuery({
    queryKey: ["manage-overview", schoolSlug],
    queryFn: () => fetchOverview({ data: { slug: schoolSlug } }),
  });

  return (
    <ManageShell schoolSlug={schoolSlug} schoolName={data?.school.name ?? schoolSlug}>
      <Outlet />
    </ManageShell>
  );
}