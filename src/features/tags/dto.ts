export type TTagRow = {
  id: string;
  orgId: string;
  name: string;
  kind: string;
  isActive: boolean;
};

export type TCreateTagInput = {
  orgId: string;
  name: string;
  kind: string;
  isActive?: boolean;
};

export type TPatchTagInput = {
  orgId: string;
  tagId: string;
  name?: string;
  kind?: string;
  isActive?: boolean;
};

export type TListTagsInput = {
  orgId: string;
  kind?: string;
  q?: string;
  isActive?: boolean;
  limit?: number;
  offset?: number;
  orderBy?: "name" | "createdAt";
  order?: "asc" | "desc";
};
