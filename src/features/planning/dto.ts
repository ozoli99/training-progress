export type TPlannedSessionRow = {
  id: string;
  orgId: string;
  athleteId: string;
  plannedDate: string;
  title: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type TPlannedSessionBlockRow = {
  id: string;
  plannedSessionId: string;
  blockIndex: number;
  blockType: string | null;
  title: string | null;
  notes: string | null;
};

export type TPlannedSetRow = {
  id: string;
  plannedSessionBlockId: string;
  exerciseId: string;
  setIndex: number;
  targetReps: number | null;
  targetLoadKg: string | null;
  targetDurationS: string | null;
  prescription: string | null;
};

export type TPlannedWorkoutRow = {
  id: string;
  plannedSessionBlockId: string;
  workoutId: string;
  targetResult: string | null;
};

export type TListPlannedSessionsInput = {
  orgId: string;
  athleteId?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
  orderBy?: "plannedDate" | "createdAt" | "updatedAt" | "title" | "id";
  order?: "asc" | "desc";
};

export type TGetPlannedSessionInput = { orgId: string; id: string };
export type TCreatePlannedSessionInput = {
  orgId: string;
  athleteId: string;
  plannedDate: string;
  title?: string | null;
  notes?: string | null;
};
export type TPatchPlannedSessionInput = {
  orgId: string;
  id: string;
  athleteId?: string;
  plannedDate?: string;
  title?: string | null;
  notes?: string | null;
};
export type TDeletePlannedSessionInput = { orgId: string; id: string };

export type TListPlannedBlocksInput = {
  orgId: string;
  plannedSessionId: string;
};
export type TGetPlannedBlockInput = { orgId: string; id: string };
export type TCreatePlannedBlockInput = {
  orgId: string;
  plannedSessionId: string;
  blockIndex?: number | null;
  blockType?: string | null;
  title?: string | null;
  notes?: string | null;
};
export type TPatchPlannedBlockInput = {
  orgId: string;
  id: string;
  blockIndex?: number | null;
  blockType?: string | null;
  title?: string | null;
  notes?: string | null;
};
export type TDeletePlannedBlockInput = { orgId: string; id: string };

export type TListPlannedSetsInput = {
  orgId: string;
  plannedSessionBlockId: string;
};
export type TGetPlannedSetInput = { orgId: string; id: string };
export type TCreatePlannedSetInput = {
  orgId: string;
  plannedSessionBlockId: string;
  exerciseId: string;
  setIndex?: number | null;
  targetReps?: number | null;
  targetLoadKg?: string | null;
  targetDurationS?: string | null;
  prescription?: string | null;
};
export type TPatchPlannedSetInput = {
  orgId: string;
  id: string;
  exerciseId?: string;
  setIndex?: number | null;
  targetReps?: number | null;
  targetLoadKg?: string | null;
  targetDurationS?: string | null;
  prescription?: string | null;
};
export type TDeletePlannedSetInput = { orgId: string; id: string };

export type TListPlannedWorkoutsInput = {
  orgId: string;
  plannedSessionBlockId: string;
};
export type TGetPlannedWorkoutInput = { orgId: string; id: string };
export type TCreatePlannedWorkoutInput = {
  orgId: string;
  plannedSessionBlockId: string;
  workoutId: string;
  targetResult?: string | null;
};
export type TPatchPlannedWorkoutInput = {
  orgId: string;
  id: string;
  workoutId?: string;
  targetResult?: string | null;
};
export type TDeletePlannedWorkoutInput = { orgId: string; id: string };
