import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { OrganizationSwitcher, UserButton } from "@clerk/nextjs";

export default async function OrgLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId, orgId } = await auth();
  if (!userId) redirect("/sign-in");
  if (!orgId) redirect("/onboarding");

  // Optionally: enforce that URL [orgId] matches active orgId to avoid cross-org leakage
  // If you want strict match, read params and compare:
  // const params = (await import("next/headers")).headers(); // or pass via function signature in new Next
  // if (params.get("x-org-id") !== orgId) redirect(`/org/${orgId}/dashboard`);

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b px-4 py-3">
        <OrganizationSwitcher hidePersonal />
        <UserButton afterSignOutUrl="/" />
      </header>
      <main>{children}</main>
    </div>
  );
}
