import { NextResponse, type NextRequest } from "next/server";
import { getAuthContext, assertOrgAccess } from "./context";
import type { OrgRole } from "./utils";
import type { AuthedRequest } from "./types";

type PublicHandler = (req: NextRequest, ctx: any) => Promise<Response>;
type UserHandler = (req: AuthedRequest, ctx: any) => Promise<Response>;
type OrgHandler = (req: AuthedRequest, ctx: any) => Promise<Response>;

type GuardOpts =
  | { scope: "public" }
  | { scope: "user" }
  | { scope: "org"; minRole?: OrgRole };

function normalizeError(e: any) {
  const status =
    e?.status ??
    (e?.name === "ZodError"
      ? 400
      : e?.name === "NotFoundError"
        ? 404
        : e?.name === "UnauthorizedError"
          ? 401
          : e?.name === "ForbiddenError"
            ? 403
            : 500);

  const message =
    e?.message ??
    (status === 401
      ? "Unauthorized"
      : status === 403
        ? "Forbidden"
        : status === 404
          ? "Not Found"
          : status === 400
            ? "Bad Request"
            : "Internal Server Error");

  return { status, message };
}

export function withApiAuth(
  handler: PublicHandler,
  opts: { scope: "public" }
): PublicHandler;
export function withApiAuth(
  handler: UserHandler,
  opts: { scope: "user" }
): UserHandler;
export function withApiAuth(
  handler: OrgHandler,
  opts: { scope: "org"; minRole?: OrgRole }
): OrgHandler;

export function withApiAuth(handler: any, opts: GuardOpts) {
  return async (req: NextRequest, ctx: any) => {
    try {
      if (opts.scope === "public") {
        return await handler(req, ctx);
      }

      const baseCtx = await getAuthContext({
        params: ctx?.params,
        headers: req.headers,
      });

      if (opts.scope === "user") {
        const authedReq = Object.assign({}, req, {
          authCtx: baseCtx,
        }) as AuthedRequest;
        return await handler(authedReq, ctx);
      }

      const scoped = await assertOrgAccess(baseCtx, opts.minRole);
      const authedReq = Object.assign({}, req, {
        authCtx: scoped,
      }) as AuthedRequest;
      return await handler(authedReq, ctx);
    } catch (e: any) {
      const { status, message } = normalizeError(e);
      return NextResponse.json({ error: message }, { status });
    }
  };
}
