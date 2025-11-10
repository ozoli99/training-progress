import type { InferSelectModel } from "drizzle-orm";
import { athleteProgram } from "@/infrastructure/db/schema";

export type TAthleteProgramRow = InferSelectModel<typeof athleteProgram>;

export type TListAthleteProgramsInput = {
  orgId: string;
  athleteId: string;
  activeOnly?: boolean;
  limit?: number;
  offset?: number;
  orderBy?: "startDate" | "createdAt" | "updatedAt" | "currentWeek";
  order?: "asc" | "desc";
};

export type TGetAthleteProgramInput = {
  orgId: string;
  athleteProgramId: string;
};

export type TEnrollAthleteProgramInput = {
  orgId: string;
  athleteId: string;
  programId: string;
  startDate?: string;
};

export type TUnenrollAthleteProgramInput = {
  orgId: string;
  athleteId: string;
  programId: string;
};

export type TPatchAthleteProgramInput = {
  orgId: string;
  athleteProgramId: string;
  currentWeek?: number;
  isActive?: boolean;
  startDate?: string;
};
