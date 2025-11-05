import { z } from "zod";
import { AppError } from "@/shared/errors";
import { parseWith } from "@/lib/validation";
import {
  CreateAthleteDto,
  ListAthletesQuery,
  UpdateAthleteDto,
  LinkLocationDto,
  SetDefaultLocationDto,
  UpsertVisibilityDto,
} from "./dto";
import {
  deleteAthleteById,
  getAthleteById,
  insertAthlete,
  listAthletes,
  setDefaultTrainingLocation,
  linkTrainingLocation,
  unlinkTrainingLocation,
  updateAthleteById,
  upsertVisibility,
  listVisibility,
} from "./repository";

function must<T>(val: T | null | undefined, msg = "Not found"): T {
  if (!val) throw new AppError.NotFound(msg);
  return val;
}

export async function svcCreateAthlete(orgId: string, body: unknown) {
  const dto = parseWith<z.infer<typeof CreateAthleteDto>>(
    CreateAthleteDto,
    body
  );
  return insertAthlete({
    orgId,
    displayName: dto.displayName,
    email: dto.email ?? null,
    clerkUserId: dto.clerkUserId ?? null,
  });
}

export async function svcListAthletes(orgId: string, query: unknown) {
  const q = parseWith<z.infer<typeof ListAthletesQuery>>(
    ListAthletesQuery,
    query ?? {}
  );
  return listAthletes({ orgId, limit: q.limit, offset: q.offset, q: q.q });
}

export async function svcGetAthleteById(athleteId: string) {
  return must(await getAthleteById(athleteId), "Athlete not found");
}

export async function svcUpdateAthleteById(athleteId: string, body: unknown) {
  const dto = parseWith<z.infer<typeof UpdateAthleteDto>>(
    UpdateAthleteDto,
    body
  );
  const row = await updateAthleteById(athleteId, {
    displayName: dto.displayName,
    email: dto.email ?? null,
    clerkUserId: dto.clerkUserId ?? null,
  });
  return must(row, "Athlete not found");
}

export async function svcDeleteAthleteById(athleteId: string) {
  await deleteAthleteById(athleteId);
  return { ok: true };
}

export async function svcLinkLocation(athleteId: string, body: unknown) {
  const dto = parseWith<z.infer<typeof LinkLocationDto>>(LinkLocationDto, body);
  return linkTrainingLocation({
    athleteId,
    trainingLocationId: dto.trainingLocationId,
    isDefault: dto.isDefault,
  });
}

export async function svcSetDefaultLocation(athleteId: string, body: unknown) {
  const dto = parseWith<z.infer<typeof SetDefaultLocationDto>>(
    SetDefaultLocationDto,
    body
  );
  return setDefaultTrainingLocation({
    athleteId,
    trainingLocationId: dto.trainingLocationId,
  });
}

export async function svcUnlinkLocation(athleteId: string, locationId: string) {
  await unlinkTrainingLocation({ athleteId, trainingLocationId: locationId });
  return { ok: true };
}

export async function svcUpsertVisibility(athleteId: string, body: unknown) {
  const dto = parseWith<z.infer<typeof UpsertVisibilityDto>>(
    UpsertVisibilityDto,
    body
  );
  return upsertVisibility({
    athleteId,
    userId: dto.userId,
    canView: dto.canView,
    canLog: dto.canLog,
    canViewCoachNotes: dto.canViewCoachNotes,
  });
}

export async function svcListVisibility(athleteId: string) {
  return listVisibility(athleteId);
}
