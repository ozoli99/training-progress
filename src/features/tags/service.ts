import { AppError } from "@/shared/errors";
import type {
  TTagRow,
  TCreateTagInput,
  TPatchTagInput,
  TListTagsInput,
} from "./dto";
import {
  makeTagsRepository,
  tagsRepository as defaultRepo,
} from "./repository";

export interface TagsService {
  list(input: TListTagsInput): Promise<TTagRow[]>;
  getById(input: { orgId: string; tagId: string }): Promise<TTagRow | null>;
  create(input: TCreateTagInput): Promise<TTagRow>;
  update(input: TPatchTagInput): Promise<TTagRow>;
  delete(input: { orgId: string; tagId: string }): Promise<void>;
}

export function makeTagsService(
  repo: ReturnType<typeof makeTagsRepository> = defaultRepo
): TagsService {
  return {
    async list(input) {
      if (!input.orgId) throw new AppError.BadRequest("orgId is required");
      return repo.list({
        ...input,
        limit: input.limit ?? 50,
        offset: input.offset ?? 0,
        orderBy: input.orderBy ?? "name",
        order: input.order ?? "asc",
      });
    },

    async getById({ orgId, tagId }) {
      if (!orgId || !tagId)
        throw new AppError.BadRequest("orgId and tagId are required");
      return repo.getById({ orgId, tagId });
    },

    async create(input) {
      if (!input.orgId) throw new AppError.BadRequest("orgId is required");
      if (!input.name?.trim())
        throw new AppError.BadRequest("name is required");
      if (!input.kind?.trim())
        throw new AppError.BadRequest("kind is required");
      return repo.create({
        orgId: input.orgId,
        name: input.name.trim(),
        kind: input.kind.trim(),
        isActive: input.isActive ?? true,
      });
    },

    async update(input) {
      if (!input.orgId || !input.tagId) {
        throw new AppError.BadRequest("orgId and tagId are required");
      }
      if (input.name !== undefined && !input.name.trim()) {
        throw new AppError.BadRequest("name cannot be empty");
      }
      if (input.kind !== undefined && !input.kind.trim()) {
        throw new AppError.BadRequest("kind cannot be empty");
      }
      return repo.update({
        orgId: input.orgId,
        tagId: input.tagId,
        name: input.name?.trim(),
        kind: input.kind?.trim(),
        isActive: input.isActive,
      });
    },

    async delete({ orgId, tagId }) {
      if (!orgId || !tagId)
        throw new AppError.BadRequest("orgId and tagId are required");
      await repo.delete({ orgId, tagId });
    },
  };
}

export const tagsService = makeTagsService();
