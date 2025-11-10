// features/skills/repository.ts

import { db } from "@/infrastructure/db/client";
import * as s from "@/infrastructure/db/schema"; // assumes your schema barrel exports all tables
import { and, eq, gte, lte } from "drizzle-orm";
import type {
  TSkillLogRow,
  TListSkillsInput,
  TCreateSkillInput,
  TPatchSkillInput,
  TGetSkillInput,
  TDeleteSkillInput,
} from "./dto";
import { AppError } from "@/shared/errors";

function mapRow(r: any): TSkillLogRow {
  return {
    id: r.id,
    orgId: r.orgId,
    athleteId: r.athleteId,
    sessionId: r.sessionId,
    sessionBlockId: r.sessionBlockId ?? null,
    exerciseId: r.exerciseId ?? null,
    attempts: r.attempts ?? null,
    successes: r.successes ?? null,
    // numeric may come back as string; normalize to number if not null
    qualityScore: r.qualityScore == null ? null : Number(r.qualityScore),
    notes: r.notes ?? null,
  };
}

export interface SkillsRepository {
  assertSessionScope(input: {
    orgId: string;
    athleteId: string;
    sessionId: string;
  }): Promise<void>;
  list(input: TListSkillsInput): Promise<TSkillLogRow[]>;
  getById(input: TGetSkillInput): Promise<TSkillLogRow | null>;
  create(input: TCreateSkillInput): Promise<TSkillLogRow>;
  update(input: TPatchSkillInput): Promise<TSkillLogRow>;
  delete(input: TDeleteSkillInput): Promise<void>;
}

export function makeSkillsRepository(): SkillsRepository {
  return {
    /** Ensure the session belongs to the given org + athlete. Throws if not. */
    async assertSessionScope(input: {
      orgId: string;
      athleteId: string;
      sessionId: string;
    }) {
      const row = await db
        .select({
          id: s.session.id,
        })
        .from(s.session)
        .where(
          and(
            eq(s.session.id, input.sessionId),
            eq(s.session.orgId, input.orgId),
            eq(s.session.athleteId, input.athleteId)
          )
        )
        .limit(1);

      if (!row.length) {
        throw new AppError.NotFound("Session not found in this org/athlete.");
      }
    },

    async list(input: TListSkillsInput): Promise<TSkillLogRow[]> {
      await this.assertSessionScope(input);

      const where = and(
        eq(s.skillLog.sessionId, input.sessionId),
        input.exerciseId
          ? eq(s.skillLog.exerciseId, input.exerciseId)
          : undefined,
        input.minQualityScore != null
          ? gte(s.skillLog.qualityScore, input.minQualityScore as any)
          : undefined,
        input.maxQualityScore != null
          ? lte(s.skillLog.qualityScore, input.maxQualityScore as any)
          : undefined
      );

      const rows = await db
        .select({
          id: s.skillLog.id,
          sessionId: s.skillLog.sessionId,
          sessionBlockId: s.skillLog.sessionBlockId,
          exerciseId: s.skillLog.exerciseId,
          attempts: s.skillLog.attempts,
          successes: s.skillLog.successes,
          qualityScore: s.skillLog.qualityScore,
          notes: s.skillLog.notes,

          // scope from joined session
          orgId: s.session.orgId,
          athleteId: s.session.athleteId,
        })
        .from(s.skillLog)
        .innerJoin(s.session, eq(s.session.id, s.skillLog.sessionId))
        .where(where)
        .orderBy(s.skillLog.id);

      return rows.map(mapRow);
    },

    async getById(input: TGetSkillInput): Promise<TSkillLogRow | null> {
      await this.assertSessionScope(input);

      const rows = await db
        .select({
          id: s.skillLog.id,
          sessionId: s.skillLog.sessionId,
          sessionBlockId: s.skillLog.sessionBlockId,
          exerciseId: s.skillLog.exerciseId,
          attempts: s.skillLog.attempts,
          successes: s.skillLog.successes,
          qualityScore: s.skillLog.qualityScore,
          notes: s.skillLog.notes,
          orgId: s.session.orgId,
          athleteId: s.session.athleteId,
        })
        .from(s.skillLog)
        .innerJoin(s.session, eq(s.session.id, s.skillLog.sessionId))
        .where(
          and(
            eq(s.skillLog.id, input.skillLogId),
            eq(s.skillLog.sessionId, input.sessionId)
          )
        )
        .limit(1);

      if (!rows.length) return null;
      return mapRow(rows[0]);
    },

    async create(input: TCreateSkillInput): Promise<TSkillLogRow> {
      await this.assertSessionScope(input);

      const [inserted] = await db
        .insert(s.skillLog)
        .values({
          sessionId: input.sessionId,
          sessionBlockId: input.sessionBlockId ?? null,
          exerciseId: input.exerciseId ?? null,
          attempts: input.attempts ?? null,
          successes: input.successes ?? null,
          qualityScore: (input.qualityScore as any) ?? null,
          notes: input.notes ?? null,
        })
        .returning();

      // Re-select with join to attach org/athlete
      const one = await this.getById({
        orgId: input.orgId,
        athleteId: input.athleteId,
        sessionId: input.sessionId,
        skillLogId: inserted.id,
      });
      if (!one) throw new AppError.Internal("Failed to load created skill log");
      return one;
    },

    async update(input: TPatchSkillInput): Promise<TSkillLogRow> {
      await this.assertSessionScope(input);

      const patch: Partial<typeof s.skillLog.$inferInsert> = {};
      if ("sessionBlockId" in input)
        patch.sessionBlockId = input.sessionBlockId ?? null;
      if ("exerciseId" in input) patch.exerciseId = input.exerciseId ?? null;
      if ("attempts" in input) patch.attempts = input.attempts ?? null;
      if ("successes" in input) patch.successes = input.successes ?? null;
      if ("qualityScore" in input)
        patch.qualityScore = (input.qualityScore as any) ?? null;
      if ("notes" in input) patch.notes = input.notes ?? null;

      const res = await db
        .update(s.skillLog)
        .set(patch)
        .where(
          and(
            eq(s.skillLog.id, input.skillLogId),
            eq(s.skillLog.sessionId, input.sessionId)
          )
        )
        .returning();

      if (!res.length) throw new AppError.NotFound("Skill log not found");
      const one = await this.getById({
        orgId: input.orgId,
        athleteId: input.athleteId,
        sessionId: input.sessionId,
        skillLogId: input.skillLogId,
      });
      if (!one) throw new AppError.Internal("Failed to load updated skill log");
      return one;
    },

    async delete(input: TDeleteSkillInput): Promise<void> {
      await this.assertSessionScope(input);

      await db
        .delete(s.skillLog)
        .where(
          and(
            eq(s.skillLog.id, input.skillLogId),
            eq(s.skillLog.sessionId, input.sessionId)
          )
        );
    },
  };
}

export const skillsRepository = makeSkillsRepository();
