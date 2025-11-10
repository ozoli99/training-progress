import { and, desc, eq, gte, isNotNull, isNull, lte, sql } from "drizzle-orm";
import { db } from "@/infrastructure/db/client";
import { domainEvent } from "@/infrastructure/db/schema";

export interface IDomainEventsRepository {
  create(input: {
    orgId: string;
    eventType: string;
    entityType: string;
    entityId: string;
    sourceSystem?: string;
    isPublic?: boolean;
    payload?: any;
    occurredAt?: Date;
  }): Promise<{
    id: string;
    orgId: string;
    eventType: string;
    entityType: string;
    entityId: string;
    sourceSystem?: string | null;
    isPublic: boolean;
    payload?: any;
    occurredAt: string;
    processedAt: string | null;
  }>;

  getById(
    orgId: string,
    eventId: string
  ): Promise<{
    id: string;
    orgId: string;
    eventType: string;
    entityType: string;
    entityId: string;
    sourceSystem?: string | null;
    isPublic: boolean;
    payload?: any;
    occurredAt: string;
    processedAt: string | null;
  } | null>;

  list(input: {
    orgId: string;
    limit: number;
    cursor?: string;
    filters?: {
      eventType?: string;
      entityType?: string;
      entityId?: string;
      sourceSystem?: string;
      processed?: boolean;
      from?: Date;
      to?: Date;
    };
  }): Promise<{
    items: ReturnType<IDomainEventsRepository["create"]> extends Promise<
      infer T
    >
      ? T[]
      : never[];
    nextCursor: string | null;
  }>;

  markProcessed(input: {
    orgId: string;
    eventId: string;
    processedAt?: Date;
  }): Promise<void>;
}

function makeCursor(ts: Date, id: string) {
  return Buffer.from(`${ts.toISOString()}__${id}`).toString("base64");
}
function parseCursor(cursor?: string): { ts: Date; id: string } | null {
  if (!cursor) return null;
  try {
    const raw = Buffer.from(cursor, "base64").toString("utf8");
    const [iso, id] = raw.split("__");
    if (!iso || !id) return null;
    return { ts: new Date(iso), id };
  } catch {
    return null;
  }
}

class DrizzleDomainEventsRepository implements IDomainEventsRepository {
  async create(input: {
    orgId: string;
    eventType: string;
    entityType: string;
    entityId: string;
    sourceSystem?: string;
    isPublic?: boolean;
    payload?: any;
    occurredAt?: Date;
  }) {
    const rows = await db
      .insert(domainEvent)
      .values({
        orgId: input.orgId,
        eventType: input.eventType,
        entityType: input.entityType,
        entityId: input.entityId,
        sourceSystem: input.sourceSystem ?? null,
        isPublic: input.isPublic ?? false,
        payload: (input.payload ?? null) as any,
        occurredAt: input.occurredAt ?? new Date(),
      })
      .returning();
    const e = rows[0]!;
    return {
      id: e.id,
      orgId: e.orgId,
      eventType: e.eventType,
      entityType: e.entityType,
      entityId: e.entityId,
      sourceSystem: e.sourceSystem ?? null,
      isPublic: !!e.isPublic,
      payload: e.payload ?? undefined,
      occurredAt: e.occurredAt.toISOString(),
      processedAt: e.processedAt ? e.processedAt.toISOString() : null,
    };
  }

  async getById(orgId: string, eventId: string) {
    const rows = await db
      .select()
      .from(domainEvent)
      .where(and(eq(domainEvent.orgId, orgId), eq(domainEvent.id, eventId)))
      .limit(1);
    const e = rows[0];
    if (!e) return null;
    return {
      id: e.id,
      orgId: e.orgId,
      eventType: e.eventType,
      entityType: e.entityType,
      entityId: e.entityId,
      sourceSystem: e.sourceSystem ?? null,
      isPublic: !!e.isPublic,
      payload: e.payload ?? undefined,
      occurredAt: e.occurredAt.toISOString(),
      processedAt: e.processedAt ? e.processedAt.toISOString() : null,
    };
  }

  async list(input: {
    orgId: string;
    limit: number;
    cursor?: string;
    filters?: {
      eventType?: string;
      entityType?: string;
      entityId?: string;
      sourceSystem?: string;
      processed?: boolean;
      from?: Date;
      to?: Date;
    };
  }) {
    const after = parseCursor(input.cursor);

    const conds = [
      eq(domainEvent.orgId, input.orgId),
      input.filters?.eventType
        ? eq(domainEvent.eventType, input.filters.eventType)
        : undefined,
      input.filters?.entityType
        ? eq(domainEvent.entityType, input.filters.entityType)
        : undefined,
      input.filters?.entityId
        ? eq(domainEvent.entityId, input.filters.entityId)
        : undefined,
      input.filters?.sourceSystem
        ? eq(domainEvent.sourceSystem, input.filters.sourceSystem)
        : undefined,
      typeof input.filters?.processed === "boolean"
        ? input.filters.processed
          ? isNotNull(domainEvent.processedAt)
          : isNull(domainEvent.processedAt)
        : undefined,
      input.filters?.from
        ? gte(domainEvent.occurredAt, input.filters.from)
        : undefined,
      input.filters?.to
        ? lte(domainEvent.occurredAt, input.filters.to)
        : undefined,
      after
        ? sql`(${domainEvent.occurredAt})::timestamptz < ${after.ts} OR ( ${domainEvent.occurredAt} = ${after.ts} AND ${domainEvent.id} < ${after.id} )`
        : undefined,
    ].filter(Boolean) as any[];

    const rows = await db
      .select({
        id: domainEvent.id,
        orgId: domainEvent.orgId,
        eventType: domainEvent.eventType,
        entityType: domainEvent.entityType,
        entityId: domainEvent.entityId,
        sourceSystem: domainEvent.sourceSystem,
        isPublic: domainEvent.isPublic,
        payload: domainEvent.payload,
        occurredAt: domainEvent.occurredAt,
        processedAt: domainEvent.processedAt,
      })
      .from(domainEvent)
      .where(conds.length ? and(...conds) : undefined)
      .orderBy(desc(domainEvent.occurredAt), desc(domainEvent.id))
      .limit(input.limit + 1);

    const hasMore = rows.length > input.limit;
    const slice = rows.slice(0, input.limit);
    const items = slice.map((e) => ({
      id: e.id,
      orgId: e.orgId,
      eventType: e.eventType,
      entityType: e.entityType,
      entityId: e.entityId,
      sourceSystem: e.sourceSystem ?? null,
      isPublic: !!e.isPublic,
      payload: e.payload ?? undefined,
      occurredAt: e.occurredAt.toISOString(),
      processedAt: e.processedAt ? e.processedAt.toISOString() : null,
    }));

    const next =
      hasMore && slice.length
        ? makeCursor(
            slice[slice.length - 1]!.occurredAt,
            slice[slice.length - 1]!.id
          )
        : null;

    return { items, nextCursor: next };
  }

  async markProcessed(input: {
    orgId: string;
    eventId: string;
    processedAt?: Date;
  }) {
    await db
      .update(domainEvent)
      .set({ processedAt: input.processedAt ?? new Date() })
      .where(
        and(
          eq(domainEvent.orgId, input.orgId),
          eq(domainEvent.id, input.eventId)
        )
      );
  }
}

export const domainEventsRepository: IDomainEventsRepository =
  new DrizzleDomainEventsRepository();

export const domainEventCursors = { makeCursor, parseCursor };
