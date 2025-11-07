import { NextRequest, NextResponse } from "next/server";
import { handleApiError, AppError } from "@/shared/errors";
import { getAuthContext } from "@/features/auth/context";
import { setLogsService } from "@/features/set-logs/service";

export const dynamic = "force-dynamic";

type BulkCreateItem = {
  orgId: string;
  athleteId: string;
  sessionId: string;
  sessionBlockId?: string | null;
  exerciseId: string;
  plannedSetId?: string | null;
  setIndex?: number;
  reps?: number | null;
  loadKg?: number | null;
  durationS?: number | null;
  distanceM?: number | null;
  rpe?: number | null;
  toFailure?: boolean;
};

export async function POST(req: NextRequest) {
  try {
    const ctx = await getAuthContext();
    const body = await req.json().catch(() => ({}));

    const items: BulkCreateItem[] = Array.isArray(body?.items)
      ? body.items
      : [];

    if (items.length === 0) {
      throw new AppError.Validation("Body must contain items[]");
    }

    for (const it of items) {
      if (it.orgId !== ctx.orgId) {
        throw new AppError.Forbidden("Org mismatch in bulk payload.");
      }
    }

    const results = await Promise.allSettled(
      items.map((it) => setLogsService.create(it))
    );

    const ok: any[] = [];
    const failed: { index: number; error: string }[] = [];

    results.forEach((r, i) => {
      if (r.status === "fulfilled") ok.push(r.value);
      else failed.push({ index: i, error: r.reason?.message ?? "Error" });
    });

    return NextResponse.json(
      { ok, failed, counts: { ok: ok.length, failed: failed.length } },
      { status: failed.length > 0 && ok.length === 0 ? 400 : 207 } // 207 Multi-Status if mixed
    );
  } catch (err) {
    return handleApiError(err);
  }
}
