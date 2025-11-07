import { z } from "zod";
import {
  UserRow,
  CreateUserInput,
  UpdateUserInput,
  DeleteUserInput,
  ListUsersInput,
  SyncUserFromClerkInput,
  ExternalIdentityRow,
  ListExternalIdentitiesInput,
  GetExternalIdentityInput,
  CreateExternalIdentityInput,
  UpdateExternalIdentityInput,
  DeleteExternalIdentityInput,
} from "./dto";
import { usersRepository, type TUsersRepository } from "./repository";

export function makeUsersService(repository: TUsersRepository) {
  return {
    async list(input: unknown) {
      const data = ListUsersInput.parse(input);
      const rows = await repository.list(data);
      return rows.map((r) => UserRow.parse(r));
    },

    async get(input: unknown) {
      const data = z.object({ userId: z.string().uuid() }).parse(input);
      const row = await repository.get(data);
      return row ? UserRow.parse(row) : null;
    },

    async create(input: unknown) {
      const data = CreateUserInput.parse(input);
      const row = await repository.create(data);
      return UserRow.parse(row);
    },

    async update(input: unknown) {
      const data = UpdateUserInput.parse(input);
      const row = await repository.update(data);
      return UserRow.parse(row);
    },

    async delete(input: unknown) {
      const data = DeleteUserInput.parse(input);
      await repository.delete(data);
    },

    async syncFromClerk(input: unknown) {
      const data = SyncUserFromClerkInput.parse(input);
      const row = await repository.upsertFromClerk(data);
      return UserRow.parse(row);
    },

    async listExternalIdentities(input: unknown) {
      const data = ListExternalIdentitiesInput.parse(input);
      const rows = await repository.listExternalIdentities(data);
      return rows.map((r) => ExternalIdentityRow.parse(r));
    },

    async getExternalIdentity(input: unknown) {
      const data = GetExternalIdentityInput.parse(input);
      const row = await repository.getExternalIdentity(data);
      return row ? ExternalIdentityRow.parse(row) : null;
    },

    async createExternalIdentity(input: unknown) {
      const data = CreateExternalIdentityInput.parse(input);
      const row = await repository.createExternalIdentity(data);
      return ExternalIdentityRow.parse(row);
    },

    async updateExternalIdentity(input: unknown) {
      const data = UpdateExternalIdentityInput.parse(input);
      const row = await repository.updateExternalIdentity(data);
      return ExternalIdentityRow.parse(row);
    },

    async deleteExternalIdentity(input: unknown) {
      const data = DeleteExternalIdentityInput.parse(input);
      await repository.deleteExternalIdentity(data);
    },
  };
}

export const usersService = makeUsersService(usersRepository);
export type UsersService = ReturnType<typeof makeUsersService>;
