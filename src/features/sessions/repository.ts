import { and, eq, gte, lte, sql } from "drizzle-orm";
import { db as defaultDatabase } from "@/infrastructure/db/client";
import {
  session as SessionTbl,
  type session as SessionTblType,
} from "@/infrastructure/db/schema";
import type {
  TSessionRow,
  TListSessionsInput,
  TGetSessionInput,
  TCreateSessionInput,
  TUpdateSessionInput,
  TDeleteSessionInput,
} from "./dto";

function mapSessionRow(r: typeof SessionTblType.$inferSelect): TSessionRow {
  return {
    id: r.id,
    orgId: r.orgId,
    athleteId: r.athleteId,
    plannedSessionId: r.plannedSessionId ?? null,
    trainingLocationId: r.trainingLocationId ?? null,
    sessionDate: r.sessionDate as unknown as string,
    status: r.status ?? null,
    completionPct: r.completionPct ?? 0,
    loadSource: r.loadSource ?? null,
    createdAt: (r.createdAt as unknown as Date).toISOString(),
    updatedAt: (r.updatedAt as unknown as Date).toISOString(),
  };
}

export interface SessionsRepository {
  list(input: TListSessionsInput): Promise<TSessionRow[]>;
  get(input: TGetSessionInput): Promise<TSessionRow | null>;
  create(input: TCreateSessionInput): Promise<TSessionRow>;
  update(input: TUpdateSessionInput): Promise<TSessionRow>;
  delete(input: TDeleteSessionInput): Promise<void>;
}

export function makeSessionsRepository(
  database = defaultDatabase
): SessionsRepository {
  return {
    async list({
      orgId,
      athleteId,
      dateFrom,
      dateTo,
      status,
      plannedSessionId,
      trainingLocationId,
      limit = 100,
      offset = 0,
    }) {
      const base = and(
        eq(SessionTbl.orgId, orgId),
        eq(SessionTbl.athleteId, athleteId),
        dateFrom ? gte(SessionTbl.sessionDate, dateFrom) : sql`true`,
        dateTo ? lte(SessionTbl.sessionDate, dateTo) : sql`true`,
        status ? eq(SessionTbl.status, status) : sql`true`,
        plannedSessionId
          ? eq(SessionTbl.plannedSessionId, plannedSessionId)
          : sql`true`,
        trainingLocationId
          ? eq(SessionTbl.trainingLocationId, trainingLocationId)
          : sql`true`
      );

      const rows = await database
        .select()
        .from(SessionTbl)
        .where(base)
        .orderBy(sql`${SessionTbl.sessionDate} desc`)
        .limit(limit)
        .offset(offset);

      return rows.map(mapSessionRow);
    },

    async get({ orgId, athleteId, sessionId }) {
      const rows = await database
        .select()
        .from(SessionTbl)
        .where(
          and(
            eq(SessionTbl.id, sessionId),
            eq(SessionTbl.orgId, orgId),
            eq(SessionTbl.athleteId, athleteId)
          )
        )
        .limit(1);

      const row = rows[0];
      return row ? mapSessionRow(row) : null;
    },

    async create({
      orgId,
      athleteId,
      sessionDate,
      status,
      plannedSessionId,
      trainingLocationId,
      completionPct,
      loadSource,
    }) {
      const [created] = await database
        .insert(SessionTbl)
        .values({
          orgId,
          athleteId,
          sessionDate: sessionDate as any,
          status: status ?? null,
          plannedSessionId: plannedSessionId ?? null,
          trainingLocationId: trainingLocationId ?? null,
          completionPct: completionPct ?? 0,
          loadSource: loadSource ?? null,
        })
        .returning();

      return mapSessionRow(created);
    },

    async update({
      orgId,
      athleteId,
      sessionId,
      sessionDate,
      status,
      plannedSessionId,
      trainingLocationId,
      completionPct,
      loadSource,
    }) {
      const existing = await this.get({ orgId, athleteId, sessionId });
      if (!existing) {
        throw new Error("Session not found or access denied.");
      }

      const [updated] = await database
        .update(SessionTbl)
        .set({
          sessionDate:
            sessionDate === undefined
              ? sql`${SessionTbl.sessionDate}`
              : (sessionDate as any),
          status:
            status === undefined ? sql`${SessionTbl.status}` : (status as any),
          plannedSessionId:
            plannedSessionId === undefined
              ? sql`${SessionTbl.plannedSessionId}`
              : (plannedSessionId as any),
          trainingLocationId:
            trainingLocationId === undefined
              ? sql`${SessionTbl.trainingLocationId}`
              : (trainingLocationId as any),
          completionPct:
            completionPct === undefined
              ? sql`${SessionTbl.completionPct}`
              : completionPct,
          loadSource:
            loadSource === undefined
              ? sql`${SessionTbl.loadSource}`
              : (loadSource as any),
          updatedAt: sql`now()`,
        })
        .where(eq(SessionTbl.id, sessionId))
        .returning();

      return mapSessionRow(updated!);
    },

    async delete({ orgId, athleteId, sessionId }) {
      const existing = await this.get({ orgId, athleteId, sessionId });
      if (!existing) return;

      await database.delete(SessionTbl).where(eq(SessionTbl.id, sessionId));
    },
  };
}

export const sessionsRepository = makeSessionsRepository();
