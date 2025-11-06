import { auth } from "@clerk/nextjs/server";
import { createClerkClient } from "@clerk/backend";
import type { OrgRole } from "./utils";
import { UnauthorizedError, ForbiddenError, roleGte } from "./utils";

const clerk = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY!,
});

export type AuthContext = {
  userId: string;
  sessionId: string | null;
  orgId: string | null;
  orgRole: OrgRole | null;
};

function resolveOrgId({
  paramsOrgId,
  headerOrgId,
  clerkOrgId,
}: {
  paramsOrgId?: string | null;
  headerOrgId?: string | null;
  clerkOrgId?: string | null;
}): string | null {
  if (paramsOrgId) return paramsOrgId;
  if (headerOrgId) return headerOrgId;
  return clerkOrgId ?? null;
}

export async function getAuthContext(options?: {
  params?: { orgId?: string };
  headers?: Headers;
}): Promise<AuthContext> {
  const { userId, sessionId, orgId: clerkActiveOrgId, orgRole } = await auth();
  if (!userId) throw new UnauthorizedError();

  const headerOrgId =
    options?.headers?.get("x-org-id") ??
    options?.headers?.get("X-Org-Id") ??
    null;

  const orgId = resolveOrgId({
    paramsOrgId: options?.params?.orgId ?? null,
    headerOrgId,
    clerkOrgId: clerkActiveOrgId ?? null,
  });

  return {
    userId,
    sessionId: sessionId ?? null,
    orgId,
    orgRole: (orgRole as OrgRole) ?? null,
  };
}

export async function assertOrgAccess(
  context: AuthContext,
  minRole?: OrgRole
): Promise<AuthContext & { orgRole: OrgRole }> {
  if (!context.orgId) {
    throw new ForbiddenError("Organization not selected.");
  }

  const memberships = await clerk.users.getOrganizationMembershipList({
    userId: context.userId,
    limit: 200,
  });

  const me = memberships.data.find((m) => m.organization.id === context.orgId);
  if (!me) throw new ForbiddenError("Not a member of this organization.");

  const myRole = (me.role as OrgRole) ?? context.orgRole ?? null;
  if (minRole) {
    if (!myRole)
      throw new ForbiddenError("Missing role for this organization.");
    if (!roleGte(myRole, minRole))
      throw new ForbiddenError("Insufficient role.");
  }

  return { ...context, orgRole: myRole as OrgRole };
}
