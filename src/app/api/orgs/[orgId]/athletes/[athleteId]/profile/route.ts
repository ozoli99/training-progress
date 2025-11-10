import { NextRequest, NextResponse } from "next/server";
import { AppError } from "@/shared/errors";
import { getAuthContext } from "@/features/auth/context";
import { athleteProfilesService } from "@/features/athlete-profile/service";

export const dynamic = "force-dynamic";

function badRequest(msg: string) {
  throw new AppError.BadRequest(msg);
}

export async function GET(
  req: NextRequest,
  { params }: { params: { orgId: string; athleteId: string } }
) {
  try {
    const ctx = await getAuthContext();
    if (ctx.orgId !== params.orgId) {
      throw new AppError.Forbidden("Org mismatch.");
    }

    const { searchParams } = new URL(req.url);
    const athleteProfileId = searchParams.get("athleteProfileId");
    const profileDate = searchParams.get("profileDate");

    if (athleteProfileId) {
      const row = await athleteProfilesService.getById({
        orgId: params.orgId,
        athleteProfileId,
      });
      if (!row) {
        throw new AppError.NotFound("Athlete profile not found.");
      }
      return NextResponse.json(row, { status: 200 });
    }

    if (profileDate) {
      const row = await athleteProfilesService.getByDay({
        orgId: params.orgId,
        athleteId: params.athleteId,
        profileDate,
      });
      if (!row) {
        throw new AppError.NotFound("Athlete profile not found for date.");
      }
      return NextResponse.json(row, { status: 200 });
    }

    const from = searchParams.get("from") ?? undefined;
    const to = searchParams.get("to") ?? undefined;
    const limit = Number(searchParams.get("limit") ?? "50");
    const offset = Number(searchParams.get("offset") ?? "0");
    const order = (searchParams.get("order") ?? "desc") as "asc" | "desc";

    const rows = await athleteProfilesService.list({
      orgId: params.orgId,
      athleteId: params.athleteId,
      from,
      to,
      limit,
      offset,
      order,
    });
    return NextResponse.json(rows, { status: 200 });
  } catch (e: unknown) {
    const { status, body } = AppError.toHttp(e);
    return NextResponse.json(body, { status });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { orgId: string; athleteId: string } }
) {
  try {
    const ctx = await getAuthContext();
    if (ctx.orgId !== params.orgId) {
      throw new AppError.Forbidden("Org mismatch.");
    }
    const body = await req.json().catch(() => ({}));

    const row = await athleteProfilesService.upsert({
      orgId: params.orgId,
      athleteId: params.athleteId,
      ...body,
    });

    return NextResponse.json(row, { status: 201 });
  } catch (e: unknown) {
    const { status, body } = AppError.toHttp(e);
    return NextResponse.json(body, { status });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { orgId: string; athleteId: string } }
) {
  try {
    const ctx = await getAuthContext();
    if (ctx.orgId !== params.orgId) {
      throw new AppError.Forbidden("Org mismatch.");
    }
    const body = await req.json().catch(() => ({}));

    const row = await athleteProfilesService.update({
      orgId: params.orgId,
      ...body,
    });

    return NextResponse.json(row, { status: 200 });
  } catch (e: unknown) {
    const { status, body } = AppError.toHttp(e);
    return NextResponse.json(body, { status });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { orgId: string; athleteId: string } }
) {
  try {
    const ctx = await getAuthContext();
    if (ctx.orgId !== params.orgId) {
      throw new AppError.Forbidden("Org mismatch.");
    }

    const { searchParams } = new URL(req.url);
    const athleteProfileId = searchParams.get("athleteProfileId");
    if (!athleteProfileId) badRequest("Missing athleteProfileId.");

    await athleteProfilesService.delete({
      orgId: params.orgId,
      athleteProfileId,
    });

    return new NextResponse(null, { status: 204 });
  } catch (e: unknown) {
    const { status, body } = AppError.toHttp(e);
    return NextResponse.json(body, { status });
  }
}
