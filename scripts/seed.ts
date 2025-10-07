import { db } from "@/infrastructure/db/client";
import { exercises, sessionLogs, sets } from "@/infrastructure/db/schema";
import { nanoid } from "nanoid";
import { sql } from "drizzle-orm";

const HISTORY_DAYS = 180;
const TODAY = new Date();

type SessionLogRow = {
  id: string;
  date: string;
  exerciseId: string;
  notes?: string | null;
  createdAt: Date;
};

type SetRow = {
  id: string;
  sessionLogId: string;
  reps?: number | null;
  weight?: number | null;
  timeSec?: number | null;
  rpe?: number | null;
};

const toYMD = (d: Date) => d.toISOString().slice(0, 10);

const addDays = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};

const daysBetween = (a: Date, b: Date) =>
  Math.floor((b.getTime() - a.getTime()) / 86400000);

const weekIndexFrom = (start: Date, current: Date) =>
  Math.floor(daysBetween(start, current) / 7) + 1;

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(42);

const randomChance = (p: number) => rand() < p;

const pickOne = <T>(xs: T[]) => xs[Math.floor(rand() * xs.length)];

const jitter = (range: number) => (rand() * 2 - 1) * range;

const skewUnit = () => {
  let s = 0;
  for (let i = 0; i < 4; i++) s += rand();
  return (s / 4) * 2 - 1;
};

async function clearDatabase() {
  await db.delete(sets).run?.();
  await db.delete(sessionLogs).run?.();
  await db.delete(exercises).run?.();
}

function isStrengthDay(dow: number) {
  return (
    dow === 1 || dow === 3 || dow === 5 || (dow === 2 && randomChance(0.45))
  );
}
function isAccessoryDay(dow: number) {
  return (dow === 2 || dow === 4) && randomChance(0.5);
}
function isEnduranceDay(dow: number) {
  return dow === 6 || (dow === 0 && randomChance(0.5));
}

function updateTopSetsWeekly(
  isMonday: boolean,
  isDeloadWeek: boolean,
  topByExercise: Record<string, number>,
  strengthIds: string[]
) {
  if (!isMonday) return;
  const baseStep = isDeloadWeek ? 0.15 : 0.6;
  for (const id of strengthIds) {
    topByExercise[id] += baseStep + jitter(baseStep * 0.7);
  }
}

function chooseMainLifts(strengthIds: string[], isDeloadWeek: boolean) {
  const shuffled = [...strengthIds].sort(() => rand() - 0.5);
  const base = isDeloadWeek ? 1 : 2;
  const plusOne = randomChance(0.5) ? 1 : 0;
  const count = base + plusOne;
  return shuffled.slice(0, count);
}

function pushStrengthSets(
  outSets: SetRow[],
  logId: string,
  topLoad: number,
  isDeloadWeek: boolean
) {
  const baseSets = isDeloadWeek ? 2 : 3;
  const maybePlus = isDeloadWeek
    ? 0
    : (randomChance(0.5) ? 1 : 0) + (randomChance(0.25) ? 1 : 0);
  const setCount = baseSets + maybePlus;

  for (let i = 0; i < setCount; i++) {
    const reps = 3 + Math.floor(rand() * 6);
    const weight = Math.max(
      20,
      Math.round((topLoad + jitter(isDeloadWeek ? 3 : 6)) * 2) / 2
    );
    const rpe = isDeloadWeek
      ? Math.min(8.5, Math.max(5.5, Math.round((6.5 + jitter(0.8)) * 2) / 2))
      : Math.min(10, Math.max(6, Math.round((7.5 + jitter(1.2)) * 2) / 2));

    outSets.push({ id: nanoid(), sessionLogId: logId, reps, weight, rpe });
  }
}

function pushAccessoryRepsSets(outSets: SetRow[], logId: string) {
  const setCount = 3 + (randomChance(0.5) ? 1 : 0);
  for (let i = 0; i < setCount; i++) {
    const reps = Math.max(3, Math.round(8 + 4 * skewUnit()));
    const rpe = Math.min(
      10,
      Math.max(6, Math.round((7.5 + jitter(1.0)) * 2) / 2)
    );
    outSets.push({ id: nanoid(), sessionLogId: logId, reps, rpe });
  }
}

function pushPlankTimeSets(outSets: SetRow[], logId: string) {
  const setCount = 2 + (randomChance(0.5) ? 1 : 0);
  for (let i = 0; i < setCount; i++) {
    const timeSec = Math.max(20, Math.round(60 + 30 * skewUnit()));
    const rpe = Math.min(
      10,
      Math.max(6, Math.round((7.0 + jitter(1.0)) * 2) / 2)
    );
    outSets.push({ id: nanoid(), sessionLogId: logId, timeSec, rpe });
  }
}

function enduranceTimeSec(
  which: "5k" | "10k",
  startDate: Date,
  current: Date
): number {
  const daysFromStart = Math.max(0, daysBetween(startDate, current));
  const weeklyImprovement =
    Math.floor(daysFromStart / 7) * (which === "5k" ? 8 : 14);
  const base = which === "5k" ? 28 * 60 : 60 * 60;
  const floor = which === "5k" ? 18 * 60 : 40 * 60;
  return Math.max(floor, Math.round(base - weeklyImprovement + jitter(60)));
}

async function main() {
  await clearDatabase();

  const now = new Date();

  const idBackSquat = nanoid();
  const idFrontSquat = nanoid();
  const idBenchPress = nanoid();
  const idDeadlift = nanoid();
  const idOHP = nanoid();
  const idRow = nanoid();

  const idPullups = nanoid();
  const idDips = nanoid();
  const idPlank = nanoid();

  const idRun5k = nanoid();
  const idRun10k = nanoid();

  await db.insert(exercises).values([
    {
      id: idBackSquat,
      name: "Back Squat",
      unit: "weight_reps",
      createdAt: now,
    },
    {
      id: idFrontSquat,
      name: "Front Squat",
      unit: "weight_reps",
      createdAt: now,
    },
    {
      id: idBenchPress,
      name: "Bench Press",
      unit: "weight_reps",
      createdAt: now,
    },
    { id: idDeadlift, name: "Deadlift", unit: "weight_reps", createdAt: now },
    { id: idOHP, name: "Overhead Press", unit: "weight_reps", createdAt: now },
    { id: idRow, name: "Barbell Row", unit: "weight_reps", createdAt: now },

    { id: idPullups, name: "Pull-ups", unit: "reps", createdAt: now },
    { id: idDips, name: "Dips", unit: "reps", createdAt: now },

    { id: idPlank, name: "Plank Hold", unit: "time", createdAt: now },
    { id: idRun5k, name: "5K Run", unit: "time", createdAt: now },
    { id: idRun10k, name: "10K Run", unit: "time", createdAt: now },
  ]);

  const topLoadByExercise: Record<string, number> = {
    [idBackSquat]: 95,
    [idFrontSquat]: 75,
    [idBenchPress]: 80,
    [idDeadlift]: 130,
    [idOHP]: 50,
    [idRow]: 70,
  };

  const strengthExerciseIds = [
    idBackSquat,
    idBenchPress,
    idDeadlift,
    idOHP,
    idRow,
    idFrontSquat,
  ];

  const accessoryRepIds = [idPullups, idDips];
  const enduranceIds = [idRun5k, idRun10k];

  const startDate = addDays(TODAY, -(HISTORY_DAYS - 1));

  const pendingLogs: SessionLogRow[] = [];
  const pendingSets: SetRow[] = [];

  for (let offset = 0; offset < HISTORY_DAYS; offset++) {
    const currentDate = addDays(startDate, offset);
    const dateIso = toYMD(currentDate);
    const dow = currentDate.getDay();
    const weekIdx = weekIndexFrom(startDate, currentDate);
    const deloadWeek = weekIdx % 4 === 0;

    updateTopSetsWeekly(
      dow === 1,
      deloadWeek,
      topLoadByExercise,
      strengthExerciseIds
    );

    if (isStrengthDay(dow)) {
      const chosenLifts = chooseMainLifts(strengthExerciseIds, deloadWeek);

      for (const exerciseId of chosenLifts) {
        const logId = nanoid();
        pendingLogs.push({
          id: logId,
          date: dateIso,
          exerciseId,
          notes: randomChance(0.08)
            ? pickOne([
                "Felt heavy today",
                "Moved well",
                "Good bar speed",
                "Form check",
              ])
            : null,
          createdAt: new Date(),
        });
        const top = topLoadByExercise[exerciseId];
        pushStrengthSets(pendingSets, logId, top, deloadWeek);
      }
    }

    if (isAccessoryDay(dow)) {
      const chosenRepAccessories =
        accessoryRepIds.filter(() => randomChance(0.7)) ||
        (randomChance(0.5) ? [pickOne(accessoryRepIds)] : []);

      for (const exerciseId of chosenRepAccessories) {
        const logId = nanoid();
        pendingLogs.push({
          id: logId,
          date: dateIso,
          exerciseId,
          createdAt: new Date(),
        });
        pushAccessoryRepsSets(pendingSets, logId);
      }

      if (randomChance(0.6)) {
        const logId = nanoid();
        pendingLogs.push({
          id: logId,
          date: dateIso,
          exerciseId: idPlank,
          createdAt: new Date(),
        });
        pushPlankTimeSets(pendingSets, logId);
      }
    }

    if (isEnduranceDay(dow)) {
      const exerciseId = randomChance(0.65) ? idRun5k : idRun10k;
      const which = exerciseId === idRun5k ? "5k" : "10k";
      const logId = nanoid();

      pendingLogs.push({
        id: logId,
        date: dateIso,
        exerciseId,
        createdAt: new Date(),
      });

      pendingSets.push({
        id: nanoid(),
        sessionLogId: logId,
        timeSec: enduranceTimeSec(which, startDate, currentDate),
      });
    }
  }

  for (const daysAgo of [0, 2, 4]) {
    const d = addDays(TODAY, -daysAgo);
    const iso = toYMD(d);

    const [{ c: hasLog }] = await db
      .select({ c: sql<number>`count(*)` })
      .from(sessionLogs)
      .where(sql`date = ${iso} and exercise_id = ${idBackSquat}`);

    if (!hasLog) {
      const logId = nanoid();
      pendingLogs.push({
        id: logId,
        date: iso,
        exerciseId: idBackSquat,
        createdAt: new Date(),
      });

      const weight = (delta: number) =>
        Math.round((topLoadByExercise[idBackSquat] + delta + jitter(2.5)) * 2) /
        2;

      pendingSets.push(
        { id: nanoid(), sessionLogId: logId, reps: 5, weight: weight(0) },
        { id: nanoid(), sessionLogId: logId, reps: 5, weight: weight(-2) },
        { id: nanoid(), sessionLogId: logId, reps: 5, weight: weight(-4) }
      );
    }
  }

  await db.insert(sessionLogs).values(pendingLogs);
  await db.insert(sets).values(pendingSets);

  const [{ c: exerciseCount }] = await db
    .select({ c: sql<number>`count(*)` })
    .from(exercises);
  const [{ c: logCount }] = await db
    .select({ c: sql<number>`count(*)` })
    .from(sessionLogs);
  const [{ c: setCount }] = await db
    .select({ c: sql<number>`count(*)` })
    .from(sets);

  console.log(
    `Seeded: ${exerciseCount} exercises, ${logCount} session logs, ${setCount} sets over ~${HISTORY_DAYS} days.`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
