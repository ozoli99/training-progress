import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function DashboardPage({
  params,
}: {
  params: { orgId: string };
}) {
  const { userId, orgId } = await auth();
  if (!userId) redirect("/sign-in");
  if (!orgId || orgId !== params.orgId)
    redirect(`/org/${orgId ?? ""}/dashboard`);

  return <div>Dashboard</div>;
}
