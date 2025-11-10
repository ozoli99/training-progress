import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/features/auth/context";
import { AppError } from "@/shared/errors";
import { coachNotesService } from "@/features/coach-notes/service";
import { UUID } from "@/features/coach-notes/dto";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: { orgId: string; noteId: string } }
) {
  try {
    const ctx = await getAuthContext();
    if (ctx.orgId !== params.orgId) {
      throw new AppError.Forbidden("Org mismatch.");
    }

    UUID.parse(params.noteId);

    const note = await coachNotesService.getCoachNote({ id: params.noteId });
    if (!note || note.orgId !== params.orgId) {
      throw new AppError.NotFound("Coach note not found.");
    }

    if (note.isPrivate && note.authorUserId !== ctx.userId) {
      throw new AppError.Forbidden("You cannot view this private note.");
    }

    return NextResponse.json(note, { status: 200 });
  } catch (e: unknown) {
    const { status, body } = AppError.toHttp(e);
    return NextResponse.json(body, { status });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { orgId: string; noteId: string } }
) {
  try {
    const ctx = await getAuthContext();
    if (ctx.orgId !== params.orgId) {
      throw new AppError.Forbidden("Org mismatch.");
    }

    UUID.parse(params.noteId);
    const payload = await req.json().catch(() => ({}));

    const existing = await coachNotesService.getCoachNote({
      id: params.noteId,
    });
    if (!existing || existing.orgId !== params.orgId) {
      throw new AppError.NotFound("Coach note not found.");
    }

    if (existing.authorUserId !== ctx.userId) {
      throw new AppError.Forbidden("Only the author can edit this note.");
    }

    const updated = await coachNotesService.updateCoachNote({
      id: params.noteId,
      ...payload,
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (e: unknown) {
    const { status, body } = AppError.toHttp(e);
    return NextResponse.json(body, { status });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { orgId: string; noteId: string } }
) {
  try {
    const ctx = await getAuthContext();
    if (ctx.orgId !== params.orgId) {
      throw new AppError.Forbidden("Org mismatch.");
    }

    UUID.parse(params.noteId);

    const existing = await coachNotesService.getCoachNote({
      id: params.noteId,
    });
    if (!existing || existing.orgId !== params.orgId) {
      throw new AppError.NotFound("Coach note not found.");
    }

    if (existing.authorUserId !== ctx.userId) {
      throw new AppError.Forbidden("Only the author can delete this note.");
    }

    await coachNotesService.deleteCoachNote({ id: params.noteId });
    return new NextResponse(null, { status: 204 });
  } catch (e: unknown) {
    const { status, body } = AppError.toHttp(e);
    return NextResponse.json(body, { status });
  }
}
