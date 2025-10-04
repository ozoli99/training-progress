import { db } from "@/infrastructure/db/client";
import { exercises, sessionLogs } from "@/infrastructure/db/schema";
import { sql } from "drizzle-orm";
import InlineSparkline from "./InlineSparkline";

type SparkPoint = { x: string; y: number };

function ymd(d: Date) {
    return d.toISOString().slice(0, 10);
}

export default async function HeroLiveStats() {
    const [{ c: exCount }] = await db.select({ c: sql<number>`count(*)` }).from(exercises);
    const [{ c: logCount }] = await db.select({ c: sql<number>`count(*)` }).from(sessionLogs);
    
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 29);

    const logs = await db.query.sessionLogs.findMany({
        where: (l, { gte, lte, and }) => and(gte(l.date, ymd(start)), lte(l.date, ymd(end))),
        with: { sets: true },
    });

    const dayMap = new Map<string, number>();
    for (const log of logs) {
        let dayVol = 0;
        for (const set of log.sets ?? []) {
            if (set.reps && set.weight) {
                dayVol += set.reps * set.weight;
            }
        }
        dayMap.set(log.date, (dayMap.get(log.date) ?? 0) + dayVol);
    }

    const spark: SparkPoint[] = [];
    const cursor = new Date(start);
    while (cursor <= end) {
        const key = ymd(cursor);
        spark.push({ x: key, y: dayMap.get(key) ?? 0 });
        cursor.setDate(cursor.getDate() + 1);
    }

    return (
        <div>
            <div>
                <span>{exCount ?? 0} exercises</span>
                <span>•</span>
                <span>{logCount ?? 0} logs</span>
            </div>

            <span aria-hidden>•</span>

            <div>
                <span>Last 30 days volume</span>
                <InlineSparkline data={spark} />
            </div>
        </div>
    );
}