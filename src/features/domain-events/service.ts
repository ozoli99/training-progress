import { AppError } from "@/shared/errors";
import type { AuthContext } from "@/features/auth/context";
import type { IDomainEventsRepository } from "./repository";
import {
  CreateDomainEventInput,
  DomainEventDetails,
  DomainEventItem,
  GetDomainEventInput,
  ListDomainEventsInput,
  MarkProcessedInput,
  Page,
  type TDomainEventItem,
  type TDomainEventDetails,
} from "./dto";
import { domainEventsRepository } from "./repository";

function ensureOrg(ctx: AuthContext, orgId: string) {
  if (!ctx.orgId) throw new AppError.Forbidden("Organization not selected.");
  if (ctx.orgId !== orgId)
    throw new AppError.Forbidden("Cross-org access denied.");
}

export function makeDomainEventsService(repo: IDomainEventsRepository) {
  return {
    async createEvent(
      ctx: AuthContext,
      input: unknown
    ): Promise<TDomainEventItem> {
      const data = CreateDomainEventInput.parse(input);
      ensureOrg(ctx, data.orgId);

      const created = await repo.create({
        orgId: data.orgId,
        eventType: data.eventType,
        entityType: data.entityType,
        entityId: data.entityId,
        sourceSystem: data.sourceSystem,
        isPublic: data.isPublic,
        payload: data.payload,
        occurredAt: data.occurredAt ? new Date(data.occurredAt) : undefined,
      });
      return DomainEventItem.parse(created);
    },

    async getEvent(
      ctx: AuthContext,
      input: unknown
    ): Promise<TDomainEventDetails> {
      const data = GetDomainEventInput.parse(input);
      ensureOrg(ctx, data.orgId);

      const ev = await repo.getById(data.orgId, data.eventId);
      if (!ev) throw new AppError.NotFound("Event not found.");
      return DomainEventDetails.parse(ev);
    },

    async listEvents(ctx: AuthContext, input: unknown) {
      const data = ListDomainEventsInput.parse(input);
      ensureOrg(ctx, data.orgId);

      const page = await repo.list({
        orgId: data.orgId,
        limit: data.limit,
        cursor: data.cursor,
        filters: {
          eventType: data.eventType,
          entityType: data.entityType,
          entityId: data.entityId,
          sourceSystem: data.sourceSystem,
          processed: data.processed,
          from: data.from ? new Date(data.from) : undefined,
          to: data.to ? new Date(data.to) : undefined,
        },
      });

      return Page(DomainEventItem).parse(page);
    },

    async markProcessed(ctx: AuthContext, input: unknown): Promise<void> {
      const data = MarkProcessedInput.parse(input);
      ensureOrg(ctx, data.orgId);

      const ev = await repo.getById(data.orgId, data.eventId);
      if (!ev) throw new AppError.NotFound("Event not found.");

      await repo.markProcessed({
        orgId: data.orgId,
        eventId: data.eventId,
        processedAt: data.processedAt ? new Date(data.processedAt) : undefined,
      });
    },
  };
}

export const domainEventsService = makeDomainEventsService(
  domainEventsRepository
);
