import { repoGetSessionById } from "@/features/sessions/repository";
import {
  repoDeleteSkill,
  repoGetSkillById,
  repoInsertSkill,
  repoListSkillsByBlock,
  repoUpdateSkill,
} from "./repository";

export async function listSkillsService(
  sessionId: string,
  sessionBlockId?: string | null
) {
  return repoListSkillsByBlock(sessionId, sessionBlockId ?? null);
}

export async function createSkillService(
  ctx: { orgId: string; athleteId: string },
  sessionId: string,
  input: {
    sessionBlockId?: string | null;
    exerciseId?: string | null;
    attempts?: number | null;
    successes?: number | null;
    qualityScore?: string | number | null;
    notes?: string | null;
  }
) {
  const s = await repoGetSessionById(sessionId);
  if (!s) throw new Error("Session not found");
  if (s.orgId !== ctx.orgId || s.athleteId !== ctx.athleteId)
    throw new Error("Forbidden");
  return repoInsertSkill({ sessionId, ...input });
}

export async function updateSkillService(
  ctx: { orgId: string; athleteId: string },
  skillId: string,
  patch: {
    sessionBlockId?: string | null;
    exerciseId?: string | null;
    attempts?: number | null;
    successes?: number | null;
    qualityScore?: string | number | null;
    notes?: string | null;
  }
) {
  const current = await repoGetSkillById(skillId);
  if (!current) throw new Error("Skill log not found");
  const s = await repoGetSessionById(current.sessionId);
  if (!s) throw new Error("Session not found");
  if (s.orgId !== ctx.orgId || s.athleteId !== ctx.athleteId)
    throw new Error("Forbidden");
  const updated = await repoUpdateSkill(skillId, patch);
  if (!updated) throw new Error("Update failed");
  return updated;
}

export async function deleteSkillService(
  ctx: { orgId: string; athleteId: string },
  skillId: string
) {
  const current = await repoGetSkillById(skillId);
  if (!current) throw new Error("Skill log not found");
  const s = await repoGetSessionById(current.sessionId);
  if (!s) throw new Error("Session not found");
  if (s.orgId !== ctx.orgId || s.athleteId !== ctx.athleteId)
    throw new Error("Forbidden");
  await repoDeleteSkill(skillId);
}
