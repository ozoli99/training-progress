import { db } from "@/infrastructure/db/client";
import { exercises, sessionLogs, sets } from "@/infrastructure/db/schema";
import { nanoid } from "nanoid";

function ymd(d: Date) {
  return d.toISOString().slice(0, 10);
}

async function main() {
    const squatId = nanoid();
    const runId = nanoid();

    await db.insert(exercises).values([
        { id: squatId, name: "Back Squat", unit: "weight_reps", createdAt: new Date() },
        { id: runId,   name: "5K Run",     unit: "time",         createdAt: new Date() },
    ]);

    const today = new Date();

    for (let i = 0; i < 12; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() - i * 3);

        const logId = nanoid();

        await db.insert(sessionLogs).values({
            id: logId,
            date: ymd(d),
            exerciseId: squatId,
            createdAt: new Date(),
        });

        await db.insert(sets).values([
            { id: nanoid(), sessionLogId: logId, reps: 5, weight: 80 + i * 2 },
            { id: nanoid(), sessionLogId: logId, reps: 5, weight: 80 + i * 2 },
            { id: nanoid(), sessionLogId: logId, reps: 5, weight: 80 + i * 2 },
        ]);
    }

    console.log("Seeded DB");
}

main();