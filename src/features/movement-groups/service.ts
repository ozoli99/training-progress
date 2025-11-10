import { AppError } from "@/shared/errors";
import type {
  TMovementGroupRow,
  TListMovementGroupsInput,
  TGetMovementGroupInput,
  TCreateMovementGroupInput,
  TPatchMovementGroupInput,
  TDeleteMovementGroupInput,
} from "./dto";
import {
  makeMovementGroupsRepository,
  movementGroupsRepository as defaultRepo,
} from "./repository";

export interface MovementGroupsService {
  list(input: TListMovementGroupsInput): Promise<TMovementGroupRow[]>;
  getById(input: TGetMovementGroupInput): Promise<TMovementGroupRow | null>;
  create(input: TCreateMovementGroupInput): Promise<TMovementGroupRow>;
  update(input: TPatchMovementGroupInput): Promise<TMovementGroupRow>;
  delete(input: TDeleteMovementGroupInput): Promise<void>;
}

export function makeMovementGroupsService(
  repo: ReturnType<typeof makeMovementGroupsRepository> = defaultRepo
): MovementGroupsService {
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

    async getById(input) {
      if (!input.orgId || !input.movementGroupId)
        throw new AppError.BadRequest("orgId and movementGroupId are required");
      return repo.getById(input);
    },

    async create(input) {
      if (!input.orgId) throw new AppError.BadRequest("orgId is required");
      if (!input.name?.trim())
        throw new AppError.BadRequest("name is required");

      return repo.create({
        orgId: input.orgId,
        name: input.name.trim(),
        description: input.description ?? null,
        isActive: input.isActive ?? true,
      });
    },

    async update(input) {
      if (!input.orgId || !input.movementGroupId) {
        throw new AppError.BadRequest("orgId and movementGroupId are required");
      }
      if (input.name !== undefined && !input.name.trim()) {
        throw new AppError.BadRequest("name cannot be empty");
      }

      return repo.update({
        orgId: input.orgId,
        movementGroupId: input.movementGroupId,
        name: input.name?.trim(),
        description: input.description ?? null,
        isActive: input.isActive,
      });
    },

    async delete(input) {
      if (!input.orgId || !input.movementGroupId)
        throw new AppError.BadRequest("orgId and movementGroupId are required");
      await repo.delete(input);
    },
  };
}

export const movementGroupsService = makeMovementGroupsService();
