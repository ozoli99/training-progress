import { z } from "zod";

export const DomainEventItem = z.object({
  id: z.string().uuid(),
  orgId: z.string().uuid(),
  eventType: z.string(),
  entityType: z.string(),
  entityId: z.string().uuid(),
  sourceSystem: z.string().nullable().optional(),
  isPublic: z.boolean().default(false),
  payload: z.unknown().nullable().optional(),
  occurredAt: z.string(),
  processedAt: z.string().nullable(),
});
export type TDomainEventItem = z.infer<typeof DomainEventItem>;

export function Page<T extends z.ZodTypeAny>(TItem: T) {
  return z.object({
    items: z.array(TItem),
    nextCursor: z.string().nullable(),
  });
}
export type TPage<T> = { items: T[]; nextCursor: string | null };

export const CreateDomainEventInput = z.object({
  orgId: z.string().uuid(),
  eventType: z.string(),
  entityType: z.string(),
  entityId: z.string().uuid(),
  sourceSystem: z.string().optional(),
  isPublic: z.boolean().optional(),
  payload: z.unknown().optional(),
  occurredAt: z.string().datetime().optional(),
});

export const GetDomainEventInput = z.object({
  orgId: z.string().uuid(),
  eventId: z.string().uuid(),
});

export const ListDomainEventsInput = z.object({
  orgId: z.string().uuid(),
  eventType: z.string().optional(),
  entityType: z.string().optional(),
  entityId: z.string().uuid().optional(),
  sourceSystem: z.string().optional(),
  processed: z.boolean().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  limit: z.number().min(1).max(100).default(25),
  cursor: z.string().optional(),
});

export const MarkProcessedInput = z.object({
  orgId: z.string().uuid(),
  eventId: z.string().uuid(),
  processedAt: z.string().datetime().optional(),
});

export const DomainEventDetails = DomainEventItem;

export type TDomainEventDetails = z.infer<typeof DomainEventDetails>;
