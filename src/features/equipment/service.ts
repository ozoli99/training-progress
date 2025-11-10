import {
  EquipmentRow,
  ListEquipmentInput,
  CreateEquipmentInput,
  UpdateEquipmentInput,
  DeleteEquipmentInput,
  GetEquipmentInput,
} from "./dto";
import { equipmentRepository, type EquipmentRepository } from "./repository";

export function makeEquipmentService(repository: EquipmentRepository) {
  return {
    async list(input: unknown) {
      const data = ListEquipmentInput.parse(input);
      const rows = await repository.list({
        orgId: data.orgId,
        q: data.q,
        includeInactive: data.includeInactive ?? false,
      });
      return rows.map((r) => EquipmentRow.parse(r));
    },

    async get(input: unknown) {
      const data = GetEquipmentInput.parse(input);
      const row = await repository.get(data);
      if (!row) return null;
      return EquipmentRow.parse(row);
    },

    async create(input: unknown) {
      const data = CreateEquipmentInput.parse(input);
      const row = await repository.create({
        orgId: data.orgId,
        name: data.name,
        variant: data.variant ?? null,
        specs: data.specs,
        isActive: data.isActive ?? true,
      });
      return EquipmentRow.parse(row);
    },

    async update(input: unknown) {
      const data = UpdateEquipmentInput.parse(input);
      const row = await repository.update({
        orgId: data.orgId,
        equipmentId: data.equipmentId,
        name: data.name,
        variant: data.variant,
        specs: data.specs,
        isActive: data.isActive,
      });
      return EquipmentRow.parse(row);
    },

    async delete(input: unknown) {
      const data = DeleteEquipmentInput.parse(input);
      await repository.delete(data);
    },
  };
}

export const equipmentService = makeEquipmentService(equipmentRepository);
export type EquipmentService = ReturnType<typeof makeEquipmentService>;
