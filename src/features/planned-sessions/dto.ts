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

export type TListPlannedSessionsInput = {
  orgId: string;
  athleteId?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
  orderBy?: "id" | "title" | "createdAt" | "updatedAt" | "plannedDate";
  order?: "asc" | "desc";
};

export type TGetPlannedSessionInput = {
  orgId: string;
  id: string;
};

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

export type TDeletePlannedSessionInput = {
  orgId: string;
  id: string;
};
