import { z } from "zod";
import { AppError } from "@/shared/errors";
import { parseWith } from "@/lib/validation";
import {
  CreateMeasurementDto,
  ListMeasurementsQuery,
  UpdateMeasurementDto,
} from "./dto";
import {
  repoDeleteMeasurementById,
  repoGetMeasurementById,
  repoInsertMeasurement,
  repoListMeasurements,
  repoMeasurementTypeExists,
  repoUpdateMeasurementById,
} from "./repository";

function must<T>(v: T | null | undefined, msg = "Not found"): T {
  if (!v) throw new AppError.NotFound(msg);
  return v;
}

export async function svcListAthleteMeasurements(
  athleteId: string,
  query: unknown
) {
  const q = parseWith<z.infer<typeof ListMeasurementsQuery>>(
    ListMeasurementsQuery,
    query ?? {}
  );
  return repoListMeasurements({
    athleteId,
    limit: q.limit,
    offset: q.offset,
    type: q.type,
    fromIso: q.from,
    toIso: q.to,
    order: q.order,
  });
}

export async function svcCreateAthleteMeasurement(
  orgId: string,
  athleteId: string,
  body: unknown
) {
  const dto = parseWith<z.infer<typeof CreateMeasurementDto>>(
    CreateMeasurementDto,
    body
  );

  const exists = await repoMeasurementTypeExists(dto.type);
  if (!exists)
    throw new AppError.Validation(`Unknown measurement type: ${dto.type}`);

  return repoInsertMeasurement({
    orgId,
    athleteId,
    measuredAt: dto.measuredAt,
    type: dto.type,
    valueNum: dto.valueNum,
    valueJson: dto.valueJson,
    source: dto.source,
    notes: dto.notes,
  });
}

export async function svcGetMeasurement(id: string) {
  return must(await repoGetMeasurementById(id), "Measurement not found");
}

export async function svcUpdateMeasurement(id: string, body: unknown) {
  const dto = parseWith<z.infer<typeof UpdateMeasurementDto>>(
    UpdateMeasurementDto,
    body
  );

  if (dto.type) {
    const exists = await repoMeasurementTypeExists(dto.type);
    if (!exists)
      throw new AppError.Validation(`Unknown measurement type: ${dto.type}`);
  }

  must(await repoGetMeasurementById(id), "Measurement not found");

  const updated = await repoUpdateMeasurementById(id, {
    measuredAt: dto.measuredAt,
    type: dto.type,
    valueNum: dto.valueNum,
    valueJson: dto.valueJson,
    source: dto.source,
    notes: dto.notes,
  });

  return must(updated, "Measurement not found");
}

export async function svcDeleteMeasurement(id: string) {
  must(await repoGetMeasurementById(id), "Measurement not found");
  await repoDeleteMeasurementById(id);
  return { ok: true };
}
