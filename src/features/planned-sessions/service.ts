import { AppError } from "@/shared/errors";
import type {
  TPlannedSessionRow,
  TListPlannedSessionsInput,
  TGetPlannedSessionInput,
  TCreatePlannedSessionInput,
  TPatchPlannedSessionInput,
  TDeletePlannedSessionInput,
} from "./dto";
import { plannedSessionsRepository } from "./repository";

function requireNonEmpty(val: string | undefined | null, msg: string) {
  if (!val || !`${val}`.trim()) throw new AppError.Validation(msg);
}

export interface PlannedSessionsService {
  list(i: TListPlannedSessionsInput): Promise<TPlannedSessionRow[]>;
  get(i: TGetPlannedSessionInput): Promise<TPlannedSessionRow>;
  create(i: TCreatePlannedSessionInput): Promise<TPlannedSessionRow>;
  patch(i: TPatchPlannedSessionInput): Promise<TPlannedSessionRow>;
  del(i: TDeletePlannedSessionInput): Promise<void>;
}

export function makePlannedSessionsService(): PlannedSessionsService {
  return {
    async list(i) {
      return plannedSessionsRepository.list(i);
    },

    async get(i) {
      const row = await plannedSessionsRepository.get(i);
      if (!row) throw new AppError.NotFound("Planned session not found");
      return row;
    },

    async create(i) {
      requireNonEmpty(i.orgId, "orgId required");
      requireNonEmpty(i.athleteId, "athleteId required");
      requireNonEmpty(i.plannedDate, "plannedDate required");
      return plannedSessionsRepository.create(i);
    },

    async patch(i) {
      const row = await plannedSessionsRepository.patch(i);
      if (!row) throw new AppError.NotFound("Planned session not found");
      return row;
    },

    async del(i) {
      await plannedSessionsRepository.del(i);
    },
  };
}

export const plannedSessionsService = makePlannedSessionsService();
