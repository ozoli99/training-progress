import { AppError } from "@/shared/errors";
import type {
  TCreateProfileDimensionInput,
  TDeleteProfileDimensionInput,
  TGetProfileDimensionInput,
  TListProfileDimensionsInput,
  TPatchProfileDimensionInput,
  TProfileDimensionRow,
} from "./dto";
import { profileDimensionsRepository } from "./repository";

function requireNonEmpty(v: string | undefined, msg: string) {
  if (!v || !v.trim()) throw new AppError.Validation(msg);
}
function validateKey(key: string) {
  if (!/^[a-zA-Z0-9_-]+$/.test(key)) {
    throw new AppError.Validation(
      "Key must contain only letters, numbers, '-' or '_'."
    );
  }
}

export interface ProfileDimensionsService {
  list(input: TListProfileDimensionsInput): Promise<TProfileDimensionRow[]>;
  get(input: TGetProfileDimensionInput): Promise<TProfileDimensionRow>;
  getById(
    input: TGetProfileDimensionInput
  ): Promise<TProfileDimensionRow | null>;
  create(input: TCreateProfileDimensionInput): Promise<TProfileDimensionRow>;
  update(input: TPatchProfileDimensionInput): Promise<TProfileDimensionRow>;
  delete(input: TDeleteProfileDimensionInput): Promise<void>;
}

export function makeProfileDimensionsService(): ProfileDimensionsService {
  return {
    async list(input) {
      return profileDimensionsRepository.list(input);
    },

    async get(input) {
      const row = await profileDimensionsRepository.getById(input);
      if (!row) throw new AppError.NotFound("Profile dimension not found");
      return row;
    },

    async getById(input) {
      return profileDimensionsRepository.getById(input);
    },

    async create(input) {
      requireNonEmpty(input.key, "Key is required");
      requireNonEmpty(input.label, "Label is required");
      validateKey(input.key);

      const created = await profileDimensionsRepository.create(input);

      if (created.isDefault) {
        await profileDimensionsRepository.unsetOtherDefaults(
          created.orgId,
          created.id
        );
      }
      return created;
    },

    async update(input) {
      if ("key" in input && input.key !== undefined) {
        requireNonEmpty(input.key, "Key cannot be empty");
        validateKey(input.key);
      }
      if ("label" in input && input.label !== undefined) {
        requireNonEmpty(input.label, "Label cannot be empty");
      }

      const updated = await profileDimensionsRepository.update(input);
      if (!updated) throw new AppError.NotFound("Profile dimension not found");

      if (updated.isDefault) {
        await profileDimensionsRepository.unsetOtherDefaults(
          updated.orgId,
          updated.id
        );
      }
      return updated;
    },

    async delete(input) {
      const existing = await profileDimensionsRepository.getById(input);
      if (!existing) throw new AppError.NotFound("Profile dimension not found");
      await profileDimensionsRepository.delete(input);
    },
  };
}

export const profileDimensionsService = makeProfileDimensionsService();
