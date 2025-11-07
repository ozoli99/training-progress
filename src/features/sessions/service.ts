import {
  CreateSessionInput,
  DeleteSessionInput,
  GetSessionInput,
  ListSessionsInput,
  SessionRow,
  UpdateSessionInput,
  type TCreateSessionInput,
  type TDeleteSessionInput,
  type TGetSessionInput,
  type TListSessionsInput,
  type TSessionRow,
  type TUpdateSessionInput,
} from "./dto";
import { sessionsRepository } from "./repository";

export interface SessionsService {
  list(input: TListSessionsInput): Promise<TSessionRow[]>;
  get(input: TGetSessionInput): Promise<TSessionRow | null>;
  create(input: TCreateSessionInput): Promise<TSessionRow>;
  update(input: TUpdateSessionInput): Promise<TSessionRow>;
  delete(input: TDeleteSessionInput): Promise<void>;
}

export function makeSessionsService(
  repo = sessionsRepository
): SessionsService {
  return {
    async list(input) {
      const parsed = ListSessionsInput.parse(input);
      return repo.list(parsed);
    },

    async get(input) {
      const parsed = GetSessionInput.parse(input);
      return repo.get(parsed);
    },

    async create(input) {
      const parsed = CreateSessionInput.parse(input);
      const row = await repo.create(parsed);
      return SessionRow.parse(row);
    },

    async update(input) {
      const parsed = UpdateSessionInput.parse(input);
      const row = await repo.update(parsed);
      return SessionRow.parse(row);
    },

    async delete(input) {
      const parsed = DeleteSessionInput.parse(input);
      await repo.delete(parsed);
    },
  };
}

export const sessionsService = makeSessionsService();
