import type { InferSelectModel } from "drizzle-orm";
import { athleteProgram } from "@/infrastructure/db/schema";

export type TAthleteProgramRow = InferSelectModel<typeof athleteProgram>;

export type TEnrollProgramInput = {
  orgId: string;
  programId: string;
  athleteId: string;
  startDate?: string;
};

export type TUnenrollProgramInput = {
  orgId: string;
  programId: string;
  athleteId: string;
};

export type SortOrder = "asc" | "desc";

export type ProgramOrderBy = "name" | "createdAt";

export type TProgramRow = {
  id: string;
  orgId: string;
  name: string;
  description: string | null;
  goal: string | null;
  totalWeeks: number | null;
  createdAt: string;
  updatedAt: string;
};

export type TListProgramsInput = {
  orgId: string;
  q?: string;
  limit?: number;
  offset?: number;
  orderBy?: ProgramOrderBy;
  order?: SortOrder;
};

export type TGetProgramInput = {
  orgId: string;
  programId: string;
};

export type TCreateProgramInput = {
  orgId: string;
  name: string;
  description?: string | null;
  goal?: string | null;
  totalWeeks?: number | null;
};

export type TPatchProgramInput = {
  orgId: string;
  programId: string;
  name?: string;
  description?: string | null;
  goal?: string | null;
  totalWeeks?: number | null;
};

export type TDeleteProgramInput = {
  orgId: string;
  programId: string;
};

export type TProgramBlockRow = {
  id: string;
  programId: string;
  blockIndex: number;
  blockName: string | null;
  focus: string | null;
  weekStart: number | null;
  weekEnd: number | null;
};

export type TListBlocksInput = {
  orgId: string;
  programId: string;
};

export type TCreateBlockInput = {
  orgId: string;
  programId: string;
  blockIndex: number;
  blockName?: string | null;
  focus?: string | null;
  weekStart?: number | null;
  weekEnd?: number | null;
};

export type TPatchBlockInput = {
  orgId: string;
  programId: string;
  blockId: string;
  blockIndex?: number;
  blockName?: string | null;
  focus?: string | null;
  weekStart?: number | null;
  weekEnd?: number | null;
};

export type TDeleteBlockInput = {
  orgId: string;
  programId: string;
  blockId: string;
};

export type TProgramSessionRow = {
  id: string;
  programBlockId: string;
  dayOffset: number;
  title: string | null;
  notes: string | null;
  plannedSessionId: string | null;
};

export type TListSessionsInput = {
  orgId: string;
  programId: string;
  programBlockId?: string;
};

export type TCreateSessionInput = {
  orgId: string;
  programId: string;
  programBlockId: string;
  dayOffset: number;
  title?: string | null;
  notes?: string | null;
  plannedSessionId?: string | null;
};

export type TPatchSessionInput = {
  orgId: string;
  programId: string;
  sessionId: string;
  dayOffset?: number;
  title?: string | null;
  notes?: string | null;
  plannedSessionId?: string | null;
};

export type TDeleteSessionInput = {
  orgId: string;
  programId: string;
  sessionId: string;
};
