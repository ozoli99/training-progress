import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import DashboardView from "./DashboardView";

export default async function DashboardPage({
  params,
}: {
  params: { orgId: string };
}) {
  const { userId, orgId } = await auth();
  if (!userId) redirect("/sign-in");
  if (!orgId) redirect("/onboarding");
  if (orgId !== params.orgId) redirect(`/org/${orgId}/dashboard`);

  return (
    <Suspense fallback={<div className="space-y-4">Loading dashboard…</div>}>
      <DashboardView orgId={orgId} />
    </Suspense>
  );
}
