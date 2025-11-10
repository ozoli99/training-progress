import type { profileDimension } from "@/infrastructure/db/schema";

export type TProfileDimensionRow = typeof profileDimension.$inferSelect;

export type TListProfileDimensionsInput = {
  orgId: string;
  limit?: number;
  offset?: number;
  orderBy?: "id" | "key" | "label" | "displayOrder" | "isDefault" | "isActive";
  order?: "asc" | "desc";
  activeOnly?: boolean;
};

export type TGetProfileDimensionInput = {
  orgId: string;
  id: string;
};

export type TCreateProfileDimensionInput = {
  orgId: string;
  key: string;
  label: string;
  description?: string | null;
  isDefault?: boolean;
  displayOrder?: number;
  isActive?: boolean;
};

export type TPatchProfileDimensionInput = {
  orgId: string;
  id: string;
  key?: string;
  label?: string;
  description?: string | null;
  isDefault?: boolean;
  displayOrder?: number | null;
  isActive?: boolean;
};

export type TDeleteProfileDimensionInput = {
  orgId: string;
  id: string;
};
