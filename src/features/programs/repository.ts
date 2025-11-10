import { db } from "@/infrastructure/db/client";
import * as s from "@/infrastructure/db/schema";
import { and, asc, desc, eq, ilike, inArray } from "drizzle-orm";
import { AppError } from "@/shared/errors";
import type {
  TProgramRow,
  TListProgramsInput,
  TGetProgramInput,
  TCreateProgramInput,
  TPatchProgramInput,
  TDeleteProgramInput,
  TProgramBlockRow,
  TListBlocksInput,
  TCreateBlockInput,
  TPatchBlockInput,
  TDeleteBlockInput,
  TProgramSessionRow,
  TListSessionsInput,
  TCreateSessionInput,
  TPatchSessionInput,
  TDeleteSessionInput,
  TEnrollProgramInput,
  TUnenrollProgramInput,
  TAthleteProgramRow,
  ProgramOrderBy,
  SortOrder,
} from "./dto";
import { athleteProgram } from "@/infrastructure/db/schema";

function mapProgramRow(r: any): TProgramRow {
  return {
    id: r.id,
    orgId: r.orgId,
    name: r.name,
    description: r.description ?? null,
    goal: r.goal ?? null,
    totalWeeks: r.totalWeeks == null ? null : Number(r.totalWeeks),
    createdAt: r.createdAt?.toISOString?.() ?? String(r.createdAt),
    updatedAt: r.updatedAt?.toISOString?.() ?? String(r.updatedAt),
  };
}

function mapBlockRow(r: any): TProgramBlockRow {
  return {
    id: r.id,
    programId: r.programId,
    blockIndex: Number(r.blockIndex),
    blockName: r.blockName ?? null,
    focus: r.focus ?? null,
    weekStart: r.weekStart == null ? null : Number(r.weekStart),
    weekEnd: r.weekEnd == null ? null : Number(r.weekEnd),
  };
}

function mapSessionRow(r: any): TProgramSessionRow {
  return {
    id: r.id,
    programBlockId: r.programBlockId,
    dayOffset: Number(r.dayOffset),
    title: r.title ?? null,
    notes: r.notes ?? null,
    plannedSessionId: r.plannedSessionId ?? null,
  };
}

async function assertProgramInOrg(programId: string, orgId: string) {
  const rows = await db
    .select({ id: s.program.id })
    .from(s.program)
    .where(and(eq(s.program.id, programId), eq(s.program.orgId, orgId)))
    .limit(1);

  if (!rows.length) throw new AppError.NotFound("Program not found in org.");
}

async function assertBlockInProgram(blockId: string, programId: string) {
  const rows = await db
    .select({ id: s.programBlock.id })
    .from(s.programBlock)
    .where(
      and(
        eq(s.programBlock.id, blockId),
        eq(s.programBlock.programId, programId)
      )
    )
    .limit(1);

  if (!rows.length) throw new AppError.NotFound("Block not found in program.");
}

async function assertSessionInProgram(sessionId: string, programId: string) {
  const rows = await db
    .select({ id: s.programSession.id })
    .from(s.programSession)
    .innerJoin(
      s.programBlock,
      eq(s.programBlock.id, s.programSession.programBlockId)
    )
    .where(
      and(
        eq(s.programSession.id, sessionId),
        eq(s.programBlock.programId, programId)
      )
    )
    .limit(1);

  if (!rows.length)
    throw new AppError.NotFound("Session not found in program.");
}

export interface ProgramsRepository {
  enroll(input: TEnrollProgramInput): Promise<TAthleteProgramRow>;
  unenroll(input: TUnenrollProgramInput): Promise<void>;

  list(input: TListProgramsInput): Promise<TProgramRow[]>;
  getById(input: TGetProgramInput): Promise<TProgramRow | null>;
  create(input: TCreateProgramInput): Promise<TProgramRow>;
  update(input: TPatchProgramInput): Promise<TProgramRow>;
  delete(input: TDeleteProgramInput): Promise<void>;

  listBlocks(input: TListBlocksInput): Promise<TProgramBlockRow[]>;
  createBlock(input: TCreateBlockInput): Promise<TProgramBlockRow>;
  updateBlock(input: TPatchBlockInput): Promise<TProgramBlockRow>;
  deleteBlock(input: TDeleteBlockInput): Promise<void>;

  listSessions(input: TListSessionsInput): Promise<TProgramSessionRow[]>;
  createSession(input: TCreateSessionInput): Promise<TProgramSessionRow>;
  updateSession(input: TPatchSessionInput): Promise<TProgramSessionRow>;
  deleteSession(input: TDeleteSessionInput): Promise<void>;
}

export function makeProgramsRepository(): ProgramsRepository {
  return {
    async enroll(input: TEnrollProgramInput): Promise<TAthleteProgramRow> {
      const existing = await db
        .select()
        .from(athleteProgram)
        .where(
          and(
            eq(athleteProgram.orgId, input.orgId),
            eq(athleteProgram.programId, input.programId),
            eq(athleteProgram.athleteId, input.athleteId)
          )
        )
        .limit(1);

      const today = new Date();
      const iso = today.toISOString().slice(0, 10); // YYYY-MM-DD
      const startDate = input.startDate ?? iso;

      if (existing[0]) {
        const [row] = await db
          .update(athleteProgram)
          .set({
            isActive: true,
            startDate,
            currentWeek: existing[0].currentWeek ?? 1,
            updatedAt: new Date(),
          })
          .where(eq(athleteProgram.id, existing[0].id))
          .returning();
        return row!;
      }

      const [row] = await db
        .insert(athleteProgram)
        .values({
          orgId: input.orgId,
          athleteId: input.athleteId,
          programId: input.programId,
          startDate,
          currentWeek: 1,
          isActive: true,
        })
        .returning();
      return row!;
    },

    async unenroll(input: TUnenrollProgramInput): Promise<void> {
      await db
        .update(athleteProgram)
        .set({ isActive: false, updatedAt: new Date() })
        .where(
          and(
            eq(athleteProgram.orgId, input.orgId),
            eq(athleteProgram.programId, input.programId),
            eq(athleteProgram.athleteId, input.athleteId)
          )
        );
    },
    async list(input) {
      const {
        orgId,
        q,
        limit = 50,
        offset = 0,
        orderBy = "name",
        order = "asc",
      } = input;

      const where = and(
        eq(s.program.orgId, orgId),
        q ? ilike(s.program.name, `%${q}%`) : undefined
      );

      const orderExpr =
        (orderBy as ProgramOrderBy) === "createdAt"
          ? order === "asc"
            ? asc(s.program.createdAt)
            : desc(s.program.createdAt)
          : order === "asc"
            ? asc(s.program.name)
            : desc(s.program.name);

      const rows = await db
        .select({
          id: s.program.id,
          orgId: s.program.orgId,
          name: s.program.name,
          description: s.program.description,
          goal: s.program.goal,
          totalWeeks: s.program.totalWeeks,
          createdAt: s.program.createdAt,
          updatedAt: s.program.updatedAt,
        })
        .from(s.program)
        .where(where)
        .orderBy(orderExpr)
        .limit(limit)
        .offset(offset);

      return rows.map(mapProgramRow);
    },

    async getById(input) {
      const rows = await db
        .select({
          id: s.program.id,
          orgId: s.program.orgId,
          name: s.program.name,
          description: s.program.description,
          goal: s.program.goal,
          totalWeeks: s.program.totalWeeks,
          createdAt: s.program.createdAt,
          updatedAt: s.program.updatedAt,
        })
        .from(s.program)
        .where(
          and(
            eq(s.program.id, input.programId),
            eq(s.program.orgId, input.orgId)
          )
        )
        .limit(1);

      if (!rows.length) return null;
      return mapProgramRow(rows[0]);
    },

    async create(input) {
      const [inserted] = await db
        .insert(s.program)
        .values({
          orgId: input.orgId,
          name: input.name,
          description: input.description ?? null,
          goal: input.goal ?? null,
          totalWeeks: (input.totalWeeks as any) ?? null,
        })
        .returning();

      const one = await this.getById({
        orgId: input.orgId,
        programId: inserted.id,
      });
      if (!one) throw new AppError.BadRequest("Failed to load created program");
      return one;
    },

    async update(input) {
      await assertProgramInOrg(input.programId, input.orgId);

      const patch: Partial<typeof s.program.$inferInsert> = {};
      if ("name" in input && input.name !== undefined) patch.name = input.name;
      if ("description" in input) patch.description = input.description ?? null;
      if ("goal" in input) patch.goal = input.goal ?? null;
      if ("totalWeeks" in input)
        patch.totalWeeks = (input.totalWeeks as any) ?? null;

      const res = await db
        .update(s.program)
        .set(patch)
        .where(
          and(
            eq(s.program.id, input.programId),
            eq(s.program.orgId, input.orgId)
          )
        )
        .returning({ id: s.program.id });

      if (!res.length) throw new AppError.NotFound("Program not found");

      const one = await this.getById({
        orgId: input.orgId,
        programId: input.programId,
      });
      if (!one) throw new AppError.BadRequest("Failed to load updated program");
      return one;
    },

    async delete(input) {
      await assertProgramInOrg(input.programId, input.orgId);
      await db
        .delete(s.program)
        .where(
          and(
            eq(s.program.id, input.programId),
            eq(s.program.orgId, input.orgId)
          )
        );
    },

    async listBlocks(input) {
      await assertProgramInOrg(input.programId, input.orgId);

      const rows = await db
        .select({
          id: s.programBlock.id,
          programId: s.programBlock.programId,
          blockIndex: s.programBlock.blockIndex,
          blockName: s.programBlock.blockName,
          focus: s.programBlock.focus,
          weekStart: s.programBlock.weekStart,
          weekEnd: s.programBlock.weekEnd,
        })
        .from(s.programBlock)
        .where(eq(s.programBlock.programId, input.programId))
        .orderBy(asc(s.programBlock.blockIndex));

      return rows.map(mapBlockRow);
    },

    async createBlock(input) {
      await assertProgramInOrg(input.programId, input.orgId);

      const [inserted] = await db
        .insert(s.programBlock)
        .values({
          programId: input.programId,
          blockIndex: input.blockIndex,
          blockName: input.blockName ?? null,
          focus: input.focus ?? null,
          weekStart: (input.weekStart as any) ?? null,
          weekEnd: (input.weekEnd as any) ?? null,
        })
        .returning();

      const rows = await db
        .select({
          id: s.programBlock.id,
          programId: s.programBlock.programId,
          blockIndex: s.programBlock.blockIndex,
          blockName: s.programBlock.blockName,
          focus: s.programBlock.focus,
          weekStart: s.programBlock.weekStart,
          weekEnd: s.programBlock.weekEnd,
        })
        .from(s.programBlock)
        .where(eq(s.programBlock.id, inserted.id))
        .limit(1);

      return mapBlockRow(rows[0]);
    },

    async updateBlock(input) {
      await assertProgramInOrg(input.programId, input.orgId);
      await assertBlockInProgram(input.blockId, input.programId);

      const patch: Partial<typeof s.programBlock.$inferInsert> = {};
      if ("blockIndex" in input && input.blockIndex !== undefined)
        patch.blockIndex = input.blockIndex;
      if ("blockName" in input) patch.blockName = input.blockName ?? null;
      if ("focus" in input) patch.focus = input.focus ?? null;
      if ("weekStart" in input)
        patch.weekStart = (input.weekStart as any) ?? null;
      if ("weekEnd" in input) patch.weekEnd = (input.weekEnd as any) ?? null;

      const res = await db
        .update(s.programBlock)
        .set(patch)
        .where(eq(s.programBlock.id, input.blockId))
        .returning();

      if (!res.length) throw new AppError.NotFound("Block not found");

      return mapBlockRow(res[0]);
    },

    async deleteBlock(input) {
      await assertProgramInOrg(input.programId, input.orgId);
      await assertBlockInProgram(input.blockId, input.programId);
      await db
        .delete(s.programBlock)
        .where(eq(s.programBlock.id, input.blockId));
    },

    async listSessions(input) {
      await assertProgramInOrg(input.programId, input.orgId);

      const base = db
        .select({
          id: s.programSession.id,
          programBlockId: s.programSession.programBlockId,
          dayOffset: s.programSession.dayOffset,
          title: s.programSession.title,
          notes: s.programSession.notes,
          plannedSessionId: s.programSession.plannedSessionId,
        })
        .from(s.programSession)
        .innerJoin(
          s.programBlock,
          eq(s.programBlock.id, s.programSession.programBlockId)
        )
        .where(
          and(
            eq(s.programBlock.programId, input.programId),
            input.programBlockId
              ? eq(s.programSession.programBlockId, input.programBlockId)
              : undefined
          )
        )
        .orderBy(asc(s.programSession.dayOffset));

      const rows = await base;
      return rows.map(mapSessionRow);
    },

    async createSession(input) {
      await assertProgramInOrg(input.programId, input.orgId);
      await assertBlockInProgram(input.programBlockId, input.programId);

      const [inserted] = await db
        .insert(s.programSession)
        .values({
          programBlockId: input.programBlockId,
          dayOffset: input.dayOffset,
          title: input.title ?? null,
          notes: input.notes ?? null,
          plannedSessionId: input.plannedSessionId ?? null,
        })
        .returning();

      const rows = await db
        .select({
          id: s.programSession.id,
          programBlockId: s.programSession.programBlockId,
          dayOffset: s.programSession.dayOffset,
          title: s.programSession.title,
          notes: s.programSession.notes,
          plannedSessionId: s.programSession.plannedSessionId,
        })
        .from(s.programSession)
        .where(eq(s.programSession.id, inserted.id))
        .limit(1);

      return mapSessionRow(rows[0]);
    },

    async updateSession(input) {
      await assertProgramInOrg(input.programId, input.orgId);
      await assertSessionInProgram(input.sessionId, input.programId);

      const patch: Partial<typeof s.programSession.$inferInsert> = {};
      if ("dayOffset" in input && input.dayOffset !== undefined)
        patch.dayOffset = input.dayOffset;
      if ("title" in input) patch.title = input.title ?? null;
      if ("notes" in input) patch.notes = input.notes ?? null;
      if ("plannedSessionId" in input)
        patch.plannedSessionId = input.plannedSessionId ?? null;

      const res = await db
        .update(s.programSession)
        .set(patch)
        .where(eq(s.programSession.id, input.sessionId))
        .returning();

      if (!res.length) throw new AppError.NotFound("Session not found");
      return mapSessionRow(res[0]);
    },

    async deleteSession(input) {
      await assertProgramInOrg(input.programId, input.orgId);
      await assertSessionInProgram(input.sessionId, input.programId);
      await db
        .delete(s.programSession)
        .where(eq(s.programSession.id, input.sessionId));
    },
  };
}

export const programsRepository = makeProgramsRepository();
