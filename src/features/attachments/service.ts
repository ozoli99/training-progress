import {
  CreateAttachmentInput,
  UpdateAttachmentInput,
  DeleteAttachmentInput,
  ListAttachmentsInput,
  AttachmentRow,
  AttachmentsResponse,
} from "./dto";
import {
  attachmentsRepository,
  type AttachmentsRepository,
} from "./repository";

export function makeAttachmentsService(repository: AttachmentsRepository) {
  return {
    async createAttachment(input: unknown) {
      const data = CreateAttachmentInput.parse(input);
      const row = await repository.create(data);
      return AttachmentRow.parse(row);
    },

    async listAttachments(input: unknown) {
      const data = ListAttachmentsInput.parse(input);
      const items = await repository.list(data);
      return AttachmentsResponse.parse({ items });
    },

    async getAttachment(input: { id: string }) {
      const row = await repository.getById(input.id);
      return row ? AttachmentRow.parse(row) : null;
    },

    async updateAttachment(input: unknown) {
      const data = UpdateAttachmentInput.parse(input);
      const row = await repository.update(data);
      return AttachmentRow.parse(row);
    },

    async deleteAttachment(input: unknown) {
      const data = DeleteAttachmentInput.parse(input);
      await repository.delete(data.id);
    },
  };
}

export const attachmentsService = makeAttachmentsService(attachmentsRepository);
export type AttachmentsService = ReturnType<typeof makeAttachmentsService>;
