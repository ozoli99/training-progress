import { AppError } from "@/shared/errors";
import {
  ZListBlocksInput,
  ZGetBlockInput,
  ZCreateBlockInput,
  ZUpdateBlockInput,
  ZDeleteBlockInput,
  type TSessionBlockRow,
} from "./dto";
import { sessionBlocksRepository } from "./repository";

export interface SessionBlocksService {
  list(input: unknown): Promise<TSessionBlockRow[]>;
  get(input: unknown): Promise<TSessionBlockRow | null>;
  create(input: unknown): Promise<TSessionBlockRow>;
  update(input: unknown): Promise<TSessionBlockRow>;
  delete(input: unknown): Promise<void>;
}

export function makeSessionBlocksService(
  repo = sessionBlocksRepository
): SessionBlocksService {
  return {
    async list(input) {
      const parsed = ZListBlocksInput.parse(input);
      return repo.list(parsed);
    },
    async get(input) {
      const parsed = ZGetBlockInput.parse(input);
      return repo.get(parsed);
    },
    async create(input) {
      const parsed = ZCreateBlockInput.parse(input);
      return repo.create(parsed).catch((e) => {
        const msg = String(e?.message ?? e);
        if (msg.includes("ux_session_block")) {
          throw new AppError.Conflict(
            "Block index already exists in this session."
          );
        }
        throw e;
      });
    },
    async update(input) {
      const parsed = ZUpdateBlockInput.parse(input);
      return repo.update(parsed).catch((e) => {
        const msg = String(e?.message ?? e);
        if (msg.includes("ux_session_block")) {
          throw new AppError.Conflict(
            "Block index already exists in this session."
          );
        }
        throw e;
      });
    },
    async delete(input) {
      const parsed = ZDeleteBlockInput.parse(input);
      return repo.delete(parsed);
    },
  };
}

export const sessionBlocksService = makeSessionBlocksService();
