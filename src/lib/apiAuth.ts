import { auth } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";

type HandlerCtx<P = any> = { params: P };
type Authed = { userId: string; orgId?: string | null };

type AuthedHandler<P = any> = (args: {
  req: NextRequest;
  ctx: HandlerCtx<P>;
  auth: Authed;
}) => Promise<Response> | Response;

export function withAuth<P = any>(handler: AuthedHandler<P>) {
  return async (req: NextRequest, ctx: HandlerCtx<P>) => {
    const { userId, orgId } = await auth(); // runs on the server
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return handler({ req, ctx, auth: { userId, orgId } });
  };
}
