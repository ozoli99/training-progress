// src/features/auth/utils.ts

// --- Role model -------------------------------------------------------------
export type OrgRole =
  | "org:owner"
  | "org:admin"
  | "org:coach"
  | "org:athlete"
  | "org:viewer";

export const RoleOrder: OrgRole[] = [
  "org:viewer",
  "org:athlete",
  "org:coach",
  "org:admin",
  "org:owner",
];

// a >= b ?
export function roleGte(a: OrgRole | null | undefined, b: OrgRole): boolean {
  if (!a) return false;
  return RoleOrder.indexOf(a) >= RoleOrder.indexOf(b);
}

// Nice client/server guards (UI can use these too)
export const needs = {
  viewer: (r?: OrgRole | null) => roleGte(r, "org:viewer"),
  athlete: (r?: OrgRole | null) => roleGte(r, "org:athlete"),
  coach: (r?: OrgRole | null) => roleGte(r, "org:coach"),
  admin: (r?: OrgRole | null) => roleGte(r, "org:admin"),
  owner: (r?: OrgRole | null) => roleGte(r, "org:owner"),
};

// --- HTTP-ish error types (used in guards & API wrapper) --------------------
export class ForbiddenError extends Error {
  status = 403 as const;
  constructor(message = "Forbidden") {
    super(message);
    this.name = "ForbiddenError";
  }
}
export class UnauthorizedError extends Error {
  status = 401 as const;
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}
export class BadRequestError extends Error {
  status = 400 as const;
  constructor(message = "Bad Request") {
    super(message);
    this.name = "BadRequestError";
  }
}
