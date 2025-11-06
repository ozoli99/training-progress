import { auth } from "@clerk/nextjs/server";
import { roleGte, type OrgRole } from "@/features/auth/utils";
import { redirect } from "next/navigation";

export default async function AdminPage() {
  const { userId, orgRole } = await auth();
  if (!userId) redirect("/sign-in");
  if (!roleGte(orgRole as OrgRole, "org:admin")) redirect("/org"); // or 403 page
  return <div>Admin only</div>;
}
