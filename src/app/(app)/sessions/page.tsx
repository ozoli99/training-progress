import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function Page() {
  const { orgId } = await auth();
  if (orgId) redirect(`/org/${orgId}/sessions`);
  redirect("/onboarding");
}
