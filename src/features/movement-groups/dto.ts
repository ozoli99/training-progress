export type TMovementGroupRow = {
  id: string;
  orgId: string;
  name: string;
  description: string | null;
  isActive: boolean;
};

export type TListMovementGroupsInput = {
  orgId: string;
  q?: string;
  isActive?: boolean;
  limit?: number;
  offset?: number;
  orderBy?: "name" | "id";
  order?: "asc" | "desc";
};

export type TGetMovementGroupInput = {
  orgId: string;
  movementGroupId: string;
};

export type TCreateMovementGroupInput = {
  orgId: string;
  name: string;
  description?: string | null;
  isActive?: boolean;
};

export type TPatchMovementGroupInput = {
  orgId: string;
  movementGroupId: string;
  name?: string;
  description?: string | null;
  isActive?: boolean;
};

export type TDeleteMovementGroupInput = {
  orgId: string;
  movementGroupId: string;
};
