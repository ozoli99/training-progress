import { sqliteTable, integer, text, real } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

export const exercises = sqliteTable("exercises", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  unit: text("unit").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(new Date()),
});

export const sessionLogs = sqliteTable("session_logs", {
  id: text("id").primaryKey(),
  date: text("date").notNull(),
  exerciseId: text("exercise_id")
    .notNull()
    .references(() => exercises.id),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(new Date()),
});

export const sets = sqliteTable("sets", {
  id: text("id").primaryKey(),
  sessionLogId: text("session_log_id")
    .notNull()
    .references(() => sessionLogs.id),
  reps: integer("reps"),
  weight: real("weight"),
  timeSec: integer("time_sec"),
  rpe: real("rpe"),
});

export const exerciseRelations = relations(exercises, ({ many }) => ({
  logs: many(sessionLogs),
}));

export const sessionRelations = relations(sessionLogs, ({ many, one }) => ({
  exercise: one(exercises, {
    fields: [sessionLogs.exerciseId],
    references: [exercises.id],
  }),
  sets: many(sets),
}));

export const setRelations = relations(sets, ({ one }) => ({
  session: one(sessionLogs, {
    fields: [sets.sessionLogId],
    references: [sessionLogs.id],
  }),
}));
