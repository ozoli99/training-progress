import {
  CreateCoachNoteInput,
  UpdateCoachNoteInput,
  DeleteCoachNoteInput,
  ListCoachNotesInput,
  CoachNoteRow,
  CoachNotesResponse,
} from "./dto";
import { coachNotesRepository, type CoachNotesRepository } from "./repository";

export function makeCoachNotesService(repository: CoachNotesRepository) {
  return {
    async createCoachNote(input: unknown) {
      const data = CreateCoachNoteInput.parse(input);
      const row = await repository.create(data);
      return CoachNoteRow.parse(row);
    },

    async listCoachNotes(input: unknown) {
      const data = ListCoachNotesInput.parse(input);
      const items = await repository.list(data);
      return CoachNotesResponse.parse({ items });
    },

    async getCoachNote(input: { id: string }) {
      const row = await repository.getById(input.id);
      return row ? CoachNoteRow.parse(row) : null;
    },

    async updateCoachNote(input: unknown) {
      const data = UpdateCoachNoteInput.parse(input);
      const row = await repository.update(data);
      return CoachNoteRow.parse(row);
    },

    async deleteCoachNote(input: unknown) {
      const data = DeleteCoachNoteInput.parse(input);
      await repository.delete(data.id);
    },
  };
}

export const coachNotesService = makeCoachNotesService(coachNotesRepository);
export type CoachNotesService = ReturnType<typeof makeCoachNotesService>;
