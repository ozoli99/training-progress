import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/features/auth/context";
import { AppError } from "@/shared/errors";
import { attachmentsService } from "@/features/attachments/service";
import { UUID } from "@/features/attachments/dto";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: { orgId: string; attachmentId: string } }
) {
  try {
    const ctx = await getAuthContext();
    if (ctx.orgId !== params.orgId) {
      throw new AppError.Forbidden("Org mismatch.");
    }

    UUID.parse(params.attachmentId);

    const row = await attachmentsService.getAttachment({
      id: params.attachmentId,
    });

    if (!row || row.orgId !== params.orgId) {
      throw new AppError.NotFound("Attachment not found.");
    }

    return NextResponse.json(row, { status: 200 });
  } catch (e: unknown) {
    const { status, body } = AppError.toHttp(e);
    return NextResponse.json(body, { status });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { orgId: string; attachmentId: string } }
) {
  try {
    const ctx = await getAuthContext();
    if (ctx.orgId !== params.orgId) {
      throw new AppError.Forbidden("Org mismatch.");
    }

    UUID.parse(params.attachmentId);
    const payload = await req.json().catch(() => ({}));

    const existing = await attachmentsService.getAttachment({
      id: params.attachmentId,
    });
    if (!existing || existing.orgId !== params.orgId) {
      throw new AppError.NotFound("Attachment not found.");
    }

    const row = await attachmentsService.updateAttachment({
      id: params.attachmentId,
      ...payload,
    });

    return NextResponse.json(row, { status: 200 });
  } catch (e: unknown) {
    const { status, body } = AppError.toHttp(e);
    return NextResponse.json(body, { status });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { orgId: string; attachmentId: string } }
) {
  try {
    const ctx = await getAuthContext();
    if (ctx.orgId !== params.orgId) {
      throw new AppError.Forbidden("Org mismatch.");
    }

    UUID.parse(params.attachmentId);

    const existing = await attachmentsService.getAttachment({
      id: params.attachmentId,
    });
    if (!existing || existing.orgId !== params.orgId) {
      throw new AppError.NotFound("Attachment not found.");
    }

    await attachmentsService.deleteAttachment({ id: params.attachmentId });
    return new NextResponse(null, { status: 204 });
  } catch (e: unknown) {
    const { status, body } = AppError.toHttp(e);
    return NextResponse.json(body, { status });
  }
}
