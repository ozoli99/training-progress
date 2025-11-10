import { AppError } from "@/shared/errors";
import type { AuthContext } from "@/features/auth/context";
import type { IExternalIdentitiesRepository } from "./repository";
import {
  ExternalIdentityItem,
  GetExternalIdentityInput,
  ListExternalIdentitiesInput,
  Page,
  RemoveExternalIdentityInput,
  TExternalIdentityItem,
  TUpdateCredentialsInput,
  UpsertExternalIdentityInput,
  UpdateCredentialsInput,
} from "./dto";
import { externalIdentitiesRepository } from "./repository";

function ensureSelf(ctx: AuthContext, userId: string) {
  if (!ctx.userId) throw new AppError.Unauthorized("Not authenticated.");
  if (ctx.userId !== userId)
    throw new AppError.Forbidden("Cross-user access denied.");
}

export function makeExternalIdentitiesService(
  repo: IExternalIdentitiesRepository
) {
  return {
    async listIdentities(ctx: AuthContext, input: unknown) {
      const data = ListExternalIdentitiesInput.parse(input);
      ensureSelf(ctx, data.userId);
      const page = await repo.listByUser({
        userId: data.userId,
        provider: data.provider,
        limit: data.limit,
        cursor: data.cursor ?? null,
      });
      return Page(ExternalIdentityItem).parse(page);
    },

    async getIdentity(
      ctx: AuthContext,
      input: unknown
    ): Promise<TExternalIdentityItem> {
      const data = GetExternalIdentityInput.parse(input);
      ensureSelf(ctx, data.userId);

      let item: TExternalIdentityItem | null = null;
      if (data.id) item = await repo.getById(data.id);
      else if (data.provider && data.externalUserId) {
        item = await repo.getByProviderKey(data.provider, data.externalUserId);
      }

      if (!item || item.userId !== data.userId)
        throw new AppError.NotFound("External identity not found.");
      return ExternalIdentityItem.parse(item);
    },

    async upsertIdentity(
      ctx: AuthContext,
      input: unknown
    ): Promise<TExternalIdentityItem> {
      const data = UpsertExternalIdentityInput.parse(input);
      ensureSelf(ctx, data.userId);

      const result = await repo.upsert({
        userId: data.userId,
        provider: data.provider,
        externalUserId: data.externalUserId,
        credentials: data.credentials,
      });

      if (result === null) {
        throw new AppError.Conflict(
          "This external account is already linked to a different user."
        );
      }
      return ExternalIdentityItem.parse(result);
    },

    async updateCredentials(ctx: AuthContext, input: unknown): Promise<void> {
      const data = UpdateCredentialsInput.parse(input);
      ensureSelf(ctx, data.userId);

      const current = await repo.getById(data.id);
      if (!current || current.userId !== data.userId) {
        throw new AppError.NotFound("External identity not found.");
      }
      await repo.updateCredentials({
        id: data.id,
        credentials: data.credentials,
      });
    },

    async removeIdentity(ctx: AuthContext, input: unknown): Promise<void> {
      const data = RemoveExternalIdentityInput.parse(input);
      ensureSelf(ctx, data.userId);

      const current = await repo.getById(data.id);
      if (!current || current.userId !== data.userId) {
        throw new AppError.NotFound("External identity not found.");
      }
      await repo.remove({ id: data.id });
    },
  };
}

export const externalIdentitiesService = makeExternalIdentitiesService(
  externalIdentitiesRepository
);
