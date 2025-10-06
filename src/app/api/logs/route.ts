import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { logCreateSchema } from "@/domain/schemas/log";
import { createLog, getLogsInRange } from "@/infrastructure/repos/logRepo";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const start = url.searchParams.get("start");
  const end = url.searchParams.get("end");
  if (!start || !end) {
    return NextResponse.json(
      { error: "Missing start or end query parameter" },
      { status: 400 }
    );
  }
  return NextResponse.json(await getLogsInRange(start, end));
}

export async function POST(request: Request) {
  const payload = await request.json();
  const parsed = logCreateSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const logId = nanoid();
  const sets = parsed.data.sets.map((s) => ({
    id: nanoid(),
    sessionLogId: logId,
    ...s,
  }));
  await createLog({ log: { id: logId, ...parsed.data }, sets });
  return NextResponse.json({ id: logId }, { status: 201 });
}
