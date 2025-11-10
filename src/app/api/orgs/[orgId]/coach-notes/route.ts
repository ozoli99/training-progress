import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/features/auth/context";
import { AppError } from "@/shared/errors";
import { coachNotesService } from "@/features/coach-notes/service";
import { UUID } from "@/features/coach-notes/dto";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { orgId: string } }
) {
  try {
    const ctx = await getAuthContext();
    if (ctx.orgId !== params.orgId) {
      throw new AppError.Forbidden("Org mismatch.");
    }

    const { searchParams } = new URL(req.url);
    const entityType = searchParams.get("entityType") ?? undefined;
    const entityId = searchParams.get("entityId") ?? undefined;
    const authorUserId = searchParams.get("authorUserId") ?? undefined;
    const visibility = searchParams.get("visibility") as
      | "org"
      | "private"
      | "public"
      | null;
    const isPrivateParam = searchParams.get("isPrivate");

    if (entityId) UUID.parse(entityId);
    if (authorUserId) UUID.parse(authorUserId);

    const result = await coachNotesService.listCoachNotes({
      orgId: params.orgId,
      entityType,
      entityId,
      authorUserId,
      visibility: visibility ?? undefined,
      isPrivate:
        isPrivateParam === null
          ? undefined
          : isPrivateParam === "true"
            ? true
            : isPrivateParam === "false"
              ? false
              : undefined,
    });

    const filtered = {
      items: result.items.filter(
        (n) => !n.isPrivate || n.authorUserId === ctx.userId
      ),
    };

    return NextResponse.json(filtered, { status: 200 });
  } catch (e: unknown) {
    const { status, body } = AppError.toHttp(e);
    return NextResponse.json(body, { status });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { orgId: string } }
) {
  try {
    const ctx = await getAuthContext();
    if (ctx.orgId !== params.orgId) {
      throw new AppError.Forbidden("Org mismatch.");
    }

    const payload = await req.json().catch(() => ({}));
    const row = await coachNotesService.createCoachNote({
      ...payload,
      orgId: params.orgId,
      authorUserId: ctx.userId,
    });

    return NextResponse.json(row, { status: 201 });
  } catch (e: unknown) {
    const { status, body } = AppError.toHttp(e);
    return NextResponse.json(body, { status });
  }
}
