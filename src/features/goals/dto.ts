export type GoalStatus = "active" | "achieved" | "abandoned";

export type TGoalOrderBy =
  | "id"
  | "title"
  | "goalType"
  | "status"
  | "targetDate"
  | "createdAt"
  | "updatedAt";

export type TOrderDir = "asc" | "desc";

export type TAthleteGoalRow = {
  id: string;
  orgId: string;
  athleteId: string;
  goalType: string;
  title: string;
  description: string | null;
  targetEntityType: string | null;
  targetEntityId: string | null;
  targetValue: string | null;
  targetDate: string | null;
  status: GoalStatus;
  createdAt: Date;
  updatedAt: Date;
};

export type TListGoalsInput = {
  orgId: string;
  athleteId?: string;
  status?: GoalStatus;
  goalType?: string;
  targetFrom?: string;
  targetTo?: string;
  limit?: number;
  offset?: number;
  orderBy?: TGoalOrderBy;
  order?: TOrderDir;
};

export type TGetGoalInput = {
  orgId: string;
  id: string;
};

export type TCreateGoalInput = {
  orgId: string;
  athleteId: string;
  goalType: string;
  title: string;
  description?: string | null;
  targetEntityType?: string | null;
  targetEntityId?: string | null;
  targetValue?: string | null;
  targetDate?: string | null;
  status?: GoalStatus;
};

export type TPatchGoalInput = {
  orgId: string;
  id: string;
  athleteId?: string;
  goalType?: string;
  title?: string;
  description?: string | null;
  targetEntityType?: string | null;
  targetEntityId?: string | null;
  targetValue?: string | null;
  targetDate?: string | null;
  status?: GoalStatus;
};

export type TDeleteGoalInput = {
  orgId: string;
  id: string;
};

export type TGoalProgressOrderBy = "id" | "createdAt";

export type TAthleteGoalProgressRow = {
  id: string;
  athleteGoalId: string;
  sessionId: string | null;
  sourceEntityId: string | null;
  sourceEntityType: string | null;
  value: string | null;
  note: string | null;
  createdAt: Date;
};

export type TListGoalProgressInput = {
  orgId: string;
  athleteGoalId: string;
  createdFrom?: Date;
  createdTo?: Date;
  limit?: number;
  offset?: number;
  orderBy?: TGoalProgressOrderBy;
  order?: TOrderDir;
};

export type TGetGoalProgressInput = {
  orgId: string;
  id: string;
};

export type TCreateGoalProgressInput = {
  orgId: string;
  athleteGoalId: string;
  sessionId?: string | null;
  sourceEntityId?: string | null;
  sourceEntityType?: string | null;
  value?: string | null;
  note?: string | null;
};

export type TPatchGoalProgressInput = {
  orgId: string;
  id: string;
  sessionId?: string | null;
  sourceEntityId?: string | null;
  sourceEntityType?: string | null;
  value?: string | null;
  note?: string | null;
};

export type TDeleteGoalProgressInput = {
  orgId: string;
  id: string;
};
