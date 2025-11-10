"use client";

import OrgDashboard from "./OrgDashboard";
import AthleteDashboard from "./AthleteDashboard";

type Role = "owner" | "admin" | "coach" | "athlete" | null;

export default function DashboardView(props: {
  orgId: string;
  role: Role;
  athleteId: string | null;
}) {
  if (
    props.role === "owner" ||
    props.role === "admin" ||
    props.role === "coach"
  ) {
    return <OrgDashboard orgId={props.orgId} />;
  }
  if (props.role === "athlete") {
    return <AthleteDashboard orgId={props.orgId} athleteId={props.athleteId} />;
  }
  return (
    <div className="mx-auto max-w-4xl p-4">
      <h2 className="text-xl font-semibold">No access to this organization</h2>
      <p className="text-muted-foreground mt-2">
        Ask an admin to add you as a member, or switch organizations.
      </p>
    </div>
  );
}
