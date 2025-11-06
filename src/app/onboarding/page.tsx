import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import {
  OrganizationSwitcher,
  CreateOrganization,
  SignedIn,
  SignedOut,
} from "@clerk/nextjs";

export default async function OnboardingPage() {
  const { userId, orgId } = await auth();
  if (!userId) redirect("/sign-in");
  if (orgId) redirect(`/org/${orgId}/dashboard`);

  return (
    <div className="mx-auto max-w-2xl py-12 space-y-8">
      <h1 className="text-2xl font-semibold">Welcome 👋</h1>

      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          You don’t have an active organization yet. Create one or pick an
          existing org.
        </p>

        <SignedIn>
          <div className="rounded-lg border p-4">
            <h2 className="font-medium mb-2">Select an existing org</h2>
            <OrganizationSwitcher
              hidePersonal
              defaultOpen
              appearance={{ elements: { rootBox: "w-full" } }}
            />
          </div>

          <div className="rounded-lg border p-4">
            <h2 className="font-medium mb-2">Or create a new one</h2>
            <CreateOrganization />
          </div>
        </SignedIn>

        <SignedOut>{redirect("/sign-in")}</SignedOut>
      </div>
    </div>
  );
}
