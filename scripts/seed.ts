import { db } from "@/infrastructure/db/client";
import { exercises, sessionLogs, sets } from "@/infrastructure/db/schema";
import { nanoid } from "nanoid";
import { inArray, sql } from "drizzle-orm";

function ymd(d: Date) {
  return d.toISOString().slice(0, 10);
}

function mulberry32(seed: number) {
    return function() {
        let t = (seed += 0x6d2b79f5);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
}
const rnd = mulberry32(42);
const jitter = (range: number) => (rnd() * 2 - 1) * range; // [-range, +range]

async function clearAll() {
    await db.delete(sets).run?.();
    await db.delete(sessionLogs).run?.();
    await db.delete(exercises).run?.();
}

async function main() {
    await clearAll();

    const squatId = nanoid();
    const benchId = nanoid();
    const deadliftId = nanoid();
    const runId = nanoid();

    await db.insert(exercises).values([
        { id: squatId,    name: "Back Squat",  unit: "weight_reps", createdAt: new Date() },
        { id: benchId,    name: "Bench Press", unit: "weight_reps", createdAt: new Date() },
        { id: deadliftId, name: "Deadlift",    unit: "weight_reps", createdAt: new Date() },
        { id: runId,      name: "5K Run",      unit: "time",        createdAt: new Date() },
    ]);

    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - 59);

    let squatTop = 85;
    let benchTop = 70;
    let deadliftTop = 110;

    const sessionIds: string[] = [];

    const cursor = new Date(start);
    while (cursor <= today) {
        const day = cursor.getDay();
        const iso = ymd(cursor);

        const isStrengthDay = day === 1 || day === 3 || day === 5 || (day === 2 && rnd() > 0.6);
        const isRunDay = day === 6 || (day === 2 && rnd() > 0.5);

        if (day === 1) {
            squatTop += 0.5 + jitter(0.5);
            benchTop += 0.3 + jitter(0.4);
            deadliftTop += 0.7 + jitter(0.7);
        }

        if (isStrengthDay) {
            const lifts = [
                { id: squatId, top: squatTop, name: "Back Squat" },
                { id: benchId, top: benchTop, name: "Bench Press" },
                { id: deadliftId,  top: deadliftTop,  name: "Deadlift" },
            ].sort(() => rnd() - 0.5).slice(0, rnd() > 0.65 ? 2 : 1);

            for (const lift of lifts) {
                const logId = nanoid();
                sessionIds.push(logId);

                await db.insert(sessionLogs).values({
                    id: logId,
                    date: iso,
                    exerciseId: lift.id,
                    notes: rnd() > 0.85 ? "Felt heavy today" : undefined,
                    createdAt: new Date(),
                });

                const setCount = 3 + Math.floor(rnd() * 3);
                const setRows = Array.from({ length: setCount }).map(() => {
                    const reps = 3 + Math.floor(rnd() * 6);
                    const weight = Math.max(20, Math.round((lift.top + jitter(5)) * 2) / 2);
                    const rpe = Math.min(10, Math.max(6, Math.round((7.5 + jitter(1.2)) * 2) / 2));
                    return { id: nanoid(), sessionLogId: logId, reps, weight, rpe };
                });

                await db.insert(sets).values(setRows);
            }
        }

        if (isRunDay) {
            const runLogId = nanoid();
            sessionIds.push(runLogId);

            await db.insert(sessionLogs).values({
                id: runLogId,
                date: iso,
                exerciseId: runId,
                createdAt: new Date(),
            });

            const base = 28 * 60;
            const weeksFromStart = Math.floor((cursor.getTime() - start.getTime()) / (7 * 86400000));
            const improvement = weeksFromStart * 8;
            const timeSec = Math.max(20 * 60, Math.round(base - improvement + jitter(45)));

            await db.insert(sets).values([{ id: nanoid(), sessionLogId: runLogId, timeSec }]);
        }

        cursor.setDate(cursor.getDate() + 1);
    }

    const recentDays = [0, 2, 4];
    for (const off of recentDays) {
        const d = new Date(today);
        d.setDate(today.getDate() - off);
        const iso = ymd(d);

        const [{ c: hasLog }] = await db.select({ c: sql<number>`count(*)` }).from(sessionLogs).where(sql`date = ${iso} and exercise_id = ${squatId}`);

        if (!hasLog) {
            const logId = nanoid();
            await db.insert(sessionLogs).values({
                id: logId,
                date: iso,
                exerciseId: squatId,
                createdAt: new Date(),
            });
            await db.insert(sets).values([
                { id: nanoid(), sessionLogId: logId, reps: 5, weight: Math.round((squatTop + jitter(3)) * 2) / 2 },
                { id: nanoid(), sessionLogId: logId, reps: 5, weight: Math.round((squatTop - 2 + jitter(3)) * 2) / 2 },
                { id: nanoid(), sessionLogId: logId, reps: 5, weight: Math.round((squatTop - 4 + jitter(3)) * 2) / 2 },
            ]);
        }
    }

    const [{ c: exCount }]  = await db.select({ c: sql<number>`count(*)` }).from(exercises);
    const [{ c: logCount }] = await db.select({ c: sql<number>`count(*)` }).from(sessionLogs);
    const [{ c: setCount }] = await db.select({ c: sql<number>`count(*)` }).from(sets);

    console.log(`Seeded: ${exCount} exercises, ${logCount} session logs, ${setCount} sets over ~60 days.`);
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});