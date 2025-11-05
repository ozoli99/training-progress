import type { HydratedSession } from "./dto";
import {
  repoGetSessionFull,
  repoListBlocks,
  repoListSetsForSession,
  repoListSetsForBlock,
  repoListWorkoutLogs,
} from "./repository";

export async function hydrateSessionService(
  sessionId: string,
  opts?: {
    includeSets?: boolean;
    includeWorkouts?: boolean;
  }
): Promise<HydratedSession> {
  const s = await repoGetSessionFull(sessionId);
  if (!s) throw new Error("Session not found");

  const blocks = await repoListBlocks(sessionId);

  let setsByBlock: Record<string, any[]> = {};
  if (opts?.includeSets !== false) {
    const allSets = await repoListSetsForSession(sessionId);
    setsByBlock = allSets.reduce(
      (acc, sl) => {
        const k = sl.sessionBlockId ?? "__no_block__";
        (acc[k] ||= []).push(sl);
        return acc;
      },
      {} as Record<string, any[]>
    );
  }

  const workouts =
    opts?.includeWorkouts === false ? [] : await repoListWorkoutLogs(sessionId);

  return {
    session: s,
    blocks: blocks.map((b) => ({
      ...b,
      sets: setsByBlock[b.id] ?? [],
    })),
    workouts,
  };
}
