import { AppError } from "@/shared/errors";
import {
  repoListAthletePrograms,
  repoGetAthleteProgramById,
  repoInsertAthleteProgram,
  repoUpdateAthleteProgramById,
  repoDeleteAthleteProgramById,
  repoAthleteExists,
  repoProgramExists,
  repoHasAnotherActiveForSameProgram,
} from "./repository";

import type {
  ListAthleteProgramsQuery,
  CreateAthleteProgramDto,
  UpdateAthleteProgramDto,
} from "./dto";

export async function listAthletePrograms(
  orgId: string,
  athleteId: string,
  query: ListAthleteProgramsQuery
) {
  const exists = await repoAthleteExists(orgId, athleteId);
  if (!exists) throw new AppError.NotFound("Athlete not found in org");

  return repoListAthletePrograms({
    orgId,
    athleteId,
    limit: query.limit,
    offset: query.offset,
    isActive: query.isActive,
    programId: query.programId,
    order: query.order,
  });
}

export async function getAthleteProgram(
  orgId: string,
  athleteId: string,
  id: string
) {
  const row = await repoGetAthleteProgramById(id);
  if (!row || row.orgId !== orgId || row.athleteId !== athleteId) {
    throw new AppError.NotFound("Athlete program not found");
  }
  return row;
}

export async function createAthleteProgram(
  orgId: string,
  athleteId: string,
  dto: CreateAthleteProgramDto
) {
  const [athExists, progExists] = await Promise.all([
    repoAthleteExists(orgId, athleteId),
    repoProgramExists(orgId, dto.programId),
  ]);
  if (!athExists) throw new AppError.NotFound("Athlete not found in org");
  if (!progExists) throw new AppError.Validation("Invalid programId for org");

  if (dto.isActive) {
    const conflict = await repoHasAnotherActiveForSameProgram({
      orgId,
      athleteId,
      programId: dto.programId,
    });
    if (conflict) {
      throw new AppError.Conflict(
        "Another active assignment exists for this athlete & program"
      );
    }
  }

  return repoInsertAthleteProgram({
    orgId,
    athleteId,
    programId: dto.programId,
    startDate: dto.startDate,
    currentWeek: dto.currentWeek,
    isActive: dto.isActive,
  });
}

export async function updateAthleteProgram(
  orgId: string,
  athleteId: string,
  id: string,
  dto: UpdateAthleteProgramDto
) {
  const current = await repoGetAthleteProgramById(id);
  if (!current || current.orgId !== orgId || current.athleteId !== athleteId) {
    throw new AppError.NotFound("Athlete program not found");
  }

  if (dto.isActive === true) {
    const conflict = await repoHasAnotherActiveForSameProgram({
      orgId,
      athleteId,
      programId: current.programId,
      excludeId: current.id,
    });
    if (conflict) {
      throw new AppError.Conflict(
        "Another active assignment exists for this athlete & program"
      );
    }
  }

  const updated = await repoUpdateAthleteProgramById(id, {
    startDate: dto.startDate,
    currentWeek: dto.currentWeek,
    isActive: dto.isActive,
  });

  return updated!;
}

export async function deleteAthleteProgram(
  orgId: string,
  athleteId: string,
  id: string
) {
  const current = await repoGetAthleteProgramById(id);
  if (!current || current.orgId !== orgId || current.athleteId !== athleteId) {
    throw new AppError.NotFound("Athlete program not found");
  }
  await repoDeleteAthleteProgramById(id);
}
