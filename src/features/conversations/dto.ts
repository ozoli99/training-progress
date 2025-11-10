import { z } from "zod";

export const Page = <T extends z.ZodTypeAny>(Item: T) =>
  z.object({
    items: z.array(Item),
    nextCursor: z.string().nullable(),
  });

export const ConversationItem = z.object({
  id: z.string().uuid(),
  orgId: z.string().uuid(),
  subject: z.string().nullable().optional(),
  type: z.string().nullable().optional(),
  createdAt: z.string(),
  isPinned: z.boolean().default(false),
  unreadCount: z.number().int().nonnegative().default(0),
  lastMessageAt: z.string().nullable().optional(),
  lastMessagePreview: z
    .object({
      id: z.string().uuid(),
      senderUserId: z.string().uuid(),
      body: z.string(),
      sentAt: z.string(),
    })
    .nullable()
    .optional(),
});
export type TConversationItem = z.infer<typeof ConversationItem>;

export const ConversationDetails = ConversationItem.extend({
  participants: z.array(
    z.object({
      participantId: z.string().uuid(),
      userId: z.string().uuid(),
      fullName: z.string().nullable().optional(),
      avatarUrl: z.string().nullable().optional(),
      isPinned: z.boolean(),
      joinedAt: z.string(),
    })
  ),
});
export type TConversationDetails = z.infer<typeof ConversationDetails>;

export const MessageItem = z.object({
  id: z.string().uuid(),
  conversationId: z.string().uuid(),
  senderUserId: z.string().uuid(),
  senderName: z.string().nullable().optional(),
  senderAvatarUrl: z.string().nullable().optional(),
  body: z.string(),
  metadata: z.any().optional(),
  sentAt: z.string(),
  isRead: z.boolean().default(false),
});
export type TMessageItem = z.infer<typeof MessageItem>;

export const ListConversationsInput = z.object({
  orgId: z.string().uuid(),
  limit: z.number().int().min(1).max(100).default(20),
  cursor: z.string().nullable().optional(),
});

export const CreateConversationInput = z.object({
  orgId: z.string().uuid(),
  subject: z.string().optional(),
  type: z.string().optional(),
  participantUserIds: z.array(z.string().uuid()).default([]),
  firstMessage: z
    .object({
      body: z.string().min(1),
      metadata: z.any().optional(),
    })
    .optional(),
});

export const GetConversationInput = z.object({
  conversationId: z.string().uuid(),
});

export const ListMessagesInput = z.object({
  conversationId: z.string().uuid(),
  limit: z.number().int().min(1).max(100).default(20),
  cursor: z.string().nullable().optional(),
});

export const SendMessageInput = z.object({
  conversationId: z.string().uuid(),
  body: z.string().min(1),
  metadata: z.any().optional(),
});

export const MarkMessageReadInput = z.object({
  conversationId: z.string().uuid(),
  messageId: z.string().uuid(),
});

export const TogglePinInput = z.object({
  conversationId: z.string().uuid(),
  isPinned: z.boolean(),
});

export const AddParticipantInput = z.object({
  conversationId: z.string().uuid(),
  userId: z.string().uuid(),
});

export const RemoveParticipantInput = z.object({
  conversationId: z.string().uuid(),
  userId: z.string().uuid(),
});

export type PageOf<T> = z.infer<ReturnType<typeof Page<z.ZodTypeAny>>> & {
  items: T[];
};
