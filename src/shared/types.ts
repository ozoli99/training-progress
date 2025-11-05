import type { InferSelectModel, InferInsertModel } from "drizzle-orm";
import { athlete } from "@/infrastructure/db/schema";

export type AthleteRow = InferSelectModel<typeof athlete>;
export type NewAthleteRow = InferInsertModel<typeof athlete>;
