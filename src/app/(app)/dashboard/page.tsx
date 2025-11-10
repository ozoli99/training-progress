import { redirect } from "next/navigation";

export default async function GlobalDashboard() {
  const r = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/header-context`,
    {
      cache: "no-store",
    }
  );
  const ctx = await r.json();
  const orgId = ctx?.currentOrg?.id ?? null;

  if (orgId) redirect(`/org/${orgId}/dashboard`);
  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-semibold">Choose an organization</h1>
      <p className="text-muted-foreground mt-2">
        Use the organization switcher in the header to continue.
      </p>
    </div>
  );
}
