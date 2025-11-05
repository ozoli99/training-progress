import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  numeric,
  primaryKey,
  uniqueIndex,
  index,
  varchar,
  date,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

const now = () =>
  timestamp("created_at", { withTimezone: true }).defaultNow().notNull();
const updated = () =>
  timestamp("updated_at", { withTimezone: true }).defaultNow().notNull();

export const userAccount = pgTable(
  "user_account",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    clerkUserId: text("clerk_user_id"),
    email: text("email").notNull(),
    fullName: text("full_name"),
    avatarUrl: text("avatar_url"),
    createdAt: now(),
    updatedAt: updated(),
  },
  (t) => ({
    emailIdx: uniqueIndex("ux_user_email").on(t.email),
    clerkIdx: index("ix_user_clerk").on(t.clerkUserId),
  })
);

export const externalIdentity = pgTable(
  "external_identity",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => userAccount.id, { onDelete: "cascade" }),
    provider: text("provider").notNull(), // e.g. "apple", "google", "strava"
    externalUserId: text("external_user_id").notNull(),
    credentials: jsonb("credentials"),
    createdAt: now(),
    updatedAt: updated(),
  },
  (t) => ({
    ux: uniqueIndex("ux_external_identity").on(t.provider, t.externalUserId),
    userIdx: index("ix_ext_user").on(t.userId),
  })
);

export const org = pgTable(
  "org",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    clerkOrgId: text("clerk_org_id"),
    name: text("name").notNull(),
    ownerUserId: uuid("owner_user_id").references(() => userAccount.id, {
      onDelete: "set null",
    }),
    createdAt: now(),
    updatedAt: updated(),
  },
  (t) => ({
    clerkIdx: index("ix_org_clerk").on(t.clerkOrgId),
  })
);

export const orgSettings = pgTable("org_settings", {
  orgId: uuid("org_id")
    .primaryKey()
    .references(() => org.id, { onDelete: "cascade" }),
  units: text("units").default("metric"), // "metric" | "imperial"
  timezone: text("timezone").default("UTC"),
  defaultTrainingLocationId: uuid("default_training_location_id").references(
    () => trainingLocation.id,
    { onDelete: "set null" }
  ),
  preferences: jsonb("preferences").default({}),
  updatedAt: updated(),
});

export const orgMember = pgTable(
  "org_member",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => org.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => userAccount.id, { onDelete: "cascade" }),
    role: text("role").notNull(), // "owner" | "admin" | "coach" | "athlete"
    clerkMembershipId: text("clerk_membership_id"),
    createdAt: now(),
    updatedAt: updated(),
  },
  (t) => ({
    ux: uniqueIndex("ux_org_member_org_user").on(t.orgId, t.userId),
    orgIdx: index("ix_member_org").on(t.orgId),
    userIdx: index("ix_member_user").on(t.userId),
  })
);

export const entityKind = pgTable("entity_kind", {
  code: text("code").primaryKey(),
  orgId: uuid("org_id")
    .notNull()
    .references(() => org.id, { onDelete: "cascade" }),
  description: text("description"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: now(),
  updatedAt: updated(),
});

export const sessionStatus = pgTable("session_status", {
  code: text("code").primaryKey(), // 'planned','in_progress','completed','skipped'
  label: text("label").notNull(),
});

export const measurementType = pgTable("measurement_type", {
  code: text("code").primaryKey(), // 'sleep_hours','hrv_ms','resting_hr','wellness','bodyweight'
  label: text("label").notNull(),
});

export const workoutType = pgTable("workout_type", {
  code: text("code").primaryKey(), // 'amrap','for_time','emom','interval','max'
  label: text("label").notNull(),
});

export const tag = pgTable(
  "tag",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => org.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    kind: text("kind").notNull(), // 'athlete' | 'workout' | ...
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: now(),
    updatedAt: updated(),
  },
  (t) => ({
    ux: uniqueIndex("ux_tag_org_name_kind").on(t.orgId, t.name, t.kind),
    orgIdx: index("ix_tag_org").on(t.orgId),
  })
);

export const tagAssignment = pgTable(
  "tag_assignment",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => tag.id, { onDelete: "cascade" }),
    entityType: text("entity_type")
      .notNull()
      .references(() => entityKind.code),
    entityId: uuid("entity_id").notNull(),
    createdAt: now(),
  },
  (t) => ({
    tagIdx: index("ix_tag_assignment_tag").on(t.tagId),
    entityIdx: index("ix_tag_assignment_entity").on(t.entityType, t.entityId),
  })
);

export const globalExercise = pgTable(
  "global_exercise",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    category: text("category"), // 'strength', 'monostructural', 'gymnastics', ...
    modality: text("modality"), // 'barbell', 'kettlebell', 'erg', 'bodyweight', ...
    description: text("description"),
    standards: jsonb("standards"), // e.g. ROM notes, tempo conventions, scoring units, etc.
    isPublic: boolean("is_public").default(true).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: now(),
    updatedAt: updated(),
  },
  (t) => ({
    uxName: uniqueIndex("ux_global_exercise_name").on(t.name),
  })
);

export const globalExerciseMedia = pgTable(
  "global_exercise_media",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    globalExerciseId: uuid("global_exercise_id")
      .notNull()
      .references(() => globalExercise.id, { onDelete: "cascade" }),
    mediaType: text("media_type").notNull(), // 'image','video','gif','doc'
    url: text("url").notNull(),
    title: text("title"),
    displayOrder: integer("display_order").default(0).notNull(),
    createdAt: now(),
  },
  (t) => ({
    geIdx: index("ix_gex_media_ge").on(t.globalExerciseId),
    ordIdx: index("ix_gex_media_order").on(t.displayOrder),
  })
);

export const exercise = pgTable(
  "exercise",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => org.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    category: text("category"),
    modality: text("modality"),
    globalExerciseId: uuid("global_exercise_id").references(
      () => globalExercise.id,
      { onDelete: "set null" }
    ),
    createdAt: now(),
    updatedAt: updated(),
  },
  (t) => ({
    uxOrgName: uniqueIndex("ux_exercise_org_name").on(t.orgId, t.name),
    orgIdx: index("ix_exercise_org").on(t.orgId),
    geIdx: index("ix_exercise_ge").on(t.globalExerciseId),
  })
);

export const exerciseProfile = pgTable("exercise_profile", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: uuid("org_id")
    .notNull()
    .references(() => org.id, { onDelete: "cascade" }),
  athleteId: uuid("athlete_id")
    .notNull()
    .references(() => athlete.id, { onDelete: "cascade" }),
  exerciseId: uuid("exercise_id")
    .notNull()
    .references(() => exercise.id, { onDelete: "cascade" }),
  lastPerformed: date("last_performed"),
  estimated1rm: numeric("estimated_1rm"),
});

export const movementGroup = pgTable(
  "movement_group",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => org.id, { onDelete: "cascade" }),
    name: text("name").notNull(), // 'Squat','Hinge','Press','Pull','Mono','Gymnastics'
    description: text("description"),
    isActive: boolean("is_active").default(true).notNull(),
  },
  (t) => ({
    ux: uniqueIndex("ux_movement_group_org_name").on(t.orgId, t.name),
    orgIdx: index("ix_mov_group_org").on(t.orgId),
  })
);

export const exerciseMovementGroup = pgTable(
  "exercise_movement_group",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    exerciseId: uuid("exercise_id")
      .notNull()
      .references(() => exercise.id, { onDelete: "cascade" }),
    movementGroupId: uuid("movement_group_id")
      .notNull()
      .references(() => movementGroup.id, { onDelete: "cascade" }),
    createdAt: now(),
    updatedAt: updated(),
  },
  (t) => ({
    ux: uniqueIndex("ux_ex_mov_group").on(t.exerciseId, t.movementGroupId),
    exIdx: index("ix_emg_ex").on(t.exerciseId),
    mgIdx: index("ix_emg_mg").on(t.movementGroupId),
  })
);

export const equipment = pgTable(
  "equipment",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => org.id, { onDelete: "cascade" }),
    name: text("name").notNull(), // 'Barbell', 'SkiErg', 'Box', ...
    variant: text("variant"), // '20kg', '24kg KB', '20"'
    specs: jsonb("specs"),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: now(),
    updatedAt: updated(),
  },
  (t) => ({
    ux: uniqueIndex("ux_equipment_org_name_variant").on(
      t.orgId,
      t.name,
      t.variant
    ),
    orgIdx: index("ix_equipment_org").on(t.orgId),
  })
);

export const trainingLocation = pgTable(
  "training_location",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => org.id, { onDelete: "cascade" }),
    name: text("name").notNull(), // 'Main gym', 'Home/Remote'
    address: text("address"),
    type: text("type"), // 'gym','home','outdoor'
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: now(),
    updatedAt: updated(),
  },
  (t) => ({
    ux: uniqueIndex("ux_location_org_name").on(t.orgId, t.name),
    orgIdx: index("ix_location_org").on(t.orgId),
  })
);

export const trainingLocationEquipment = pgTable(
  "training_location_equipment",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    trainingLocationId: uuid("training_location_id")
      .notNull()
      .references(() => trainingLocation.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    variant: text("variant"),
    specs: jsonb("specs"),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: now(),
    updatedAt: updated(),
  },
  (t) => ({
    locIdx: index("ix_tle_loc").on(t.trainingLocationId),
  })
);

export const athleteTrainingLocation = pgTable(
  "athlete_training_location",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    athleteId: uuid("athlete_id")
      .notNull()
      .references(() => athlete.id, { onDelete: "cascade" }),
    trainingLocationId: uuid("training_location_id")
      .notNull()
      .references(() => trainingLocation.id, { onDelete: "cascade" }),
    isDefault: boolean("is_default").default(false).notNull(),
    createdAt: now(),
  },
  (t) => ({
    ux: uniqueIndex("ux_athlete_location").on(
      t.athleteId,
      t.trainingLocationId
    ),
    locIdx: index("ix_atl_loc").on(t.trainingLocationId),
  })
);

export const athlete = pgTable(
  "athlete",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => org.id, { onDelete: "cascade" }),
    displayName: text("display_name").notNull(),
    email: text("email"),
    clerkUserId: text("clerk_user_id"),
    createdAt: now(),
    updatedAt: updated(),
  },
  (t) => ({
    orgIdx: index("ix_athlete_org").on(t.orgId),
  })
);

export const athleteVisibility = pgTable(
  "athlete_visibility",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    athleteId: uuid("athlete_id")
      .notNull()
      .references(() => athlete.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => userAccount.id, { onDelete: "cascade" }),
    canView: boolean("can_view").default(true).notNull(),
    canLog: boolean("can_log").default(false).notNull(),
    canViewCoachNotes: boolean("can_view_coach_notes").default(false).notNull(),
  },
  (t) => ({
    ux: uniqueIndex("ux_athlete_visibility").on(t.athleteId, t.userId),
  })
);

export const profileDimension = pgTable(
  "profile_dimension",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => org.id, { onDelete: "cascade" }),
    key: text("key").notNull(),
    label: text("label").notNull(),
    description: text("description"),
    isDefault: boolean("is_default").default(false).notNull(),
    displayOrder: integer("display_order").default(0).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
  },
  (t) => ({
    ux: uniqueIndex("ux_profile_dimension_org_key").on(t.orgId, t.key),
  })
);

export const userProfileDimensionPref = pgTable(
  "user_profile_dimension_pref",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => org.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => userAccount.id, { onDelete: "cascade" }),
    profileDimensionId: uuid("profile_dimension_id")
      .notNull()
      .references(() => profileDimension.id),
    isEnabled: boolean("is_enabled").default(true).notNull(),
  },
  (t) => ({
    ux: uniqueIndex("ux_user_dim_pref").on(
      t.orgId,
      t.userId,
      t.profileDimensionId
    ),
  })
);

export const athleteProfile = pgTable(
  "athlete_profile",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => org.id, { onDelete: "cascade" }),
    athleteId: uuid("athlete_id")
      .notNull()
      .references(() => athlete.id, { onDelete: "cascade" }),
    profileDate: date("profile_date").notNull(),
    strengthIndex: numeric("strength_index"),
    athleteScore: numeric("athlete_score"),
    lastMetrics: jsonb("last_metrics"),
  },
  (t) => ({
    ux: uniqueIndex("ux_athlete_profile_day").on(
      t.orgId,
      t.athleteId,
      t.profileDate
    ),
  })
);

export const athleteProfileMetric = pgTable("athlete_profile_metric", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: uuid("org_id")
    .notNull()
    .references(() => org.id, { onDelete: "cascade" }),
  athleteId: uuid("athlete_id")
    .notNull()
    .references(() => athlete.id, { onDelete: "cascade" }),
  athleteProfileId: uuid("athlete_profile_id")
    .notNull()
    .references(() => athleteProfile.id, { onDelete: "cascade" }),
  profileDimensionId: uuid("profile_dimension_id")
    .notNull()
    .references(() => profileDimension.id),
  value: numeric("value").notNull(),
});

export const athleteMeasurement = pgTable(
  "athlete_measurement",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => org.id, { onDelete: "cascade" }),
    athleteId: uuid("athlete_id")
      .notNull()
      .references(() => athlete.id, { onDelete: "cascade" }),
    measuredAt: timestamp("measured_at", { withTimezone: true }).notNull(),
    type: text("type")
      .notNull()
      .references(() => measurementType.code),
    valueNum: numeric("value_num"),
    valueJson: jsonb("value_json"),
    source: text("source"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    idx: index("ix_measurement_athlete_time").on(t.athleteId, t.measuredAt),
  })
);

export const athleteProgram = pgTable(
  "athlete_program",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => org.id, { onDelete: "cascade" }),
    athleteId: uuid("athlete_id")
      .notNull()
      .references(() => athlete.id, { onDelete: "cascade" }),
    programId: uuid("program_id")
      .notNull()
      .references(() => program.id, { onDelete: "cascade" }),
    startDate: date("start_date").notNull(),
    currentWeek: integer("current_week").default(1).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: now(),
    updatedAt: updated(),
  },
  (t) => ({
    idx: index("ix_athlete_program").on(t.orgId, t.athleteId, t.programId),
  })
);

export const athleteGoal = pgTable(
  "athlete_goal",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => org.id, { onDelete: "cascade" }),
    athleteId: uuid("athlete_id")
      .notNull()
      .references(() => athlete.id, { onDelete: "cascade" }),
    goalType: text("goal_type").notNull(), // e.g. '1RM', 'bodyweight', 'open_score'
    title: text("title").notNull(),
    description: text("description"),
    targetEntityType: text("target_entity_type"),
    targetEntityId: uuid("target_entity_id"),
    targetValue: numeric("target_value"),
    targetDate: date("target_date"),
    status: text("status").default("active").notNull(), // 'active','achieved','abandoned'
    createdAt: now(),
    updatedAt: updated(),
  },
  (t) => ({
    idx: index("ix_goal_athlete").on(t.athleteId, t.status),
  })
);

export const athleteGoalProgress = pgTable(
  "athlete_goal_progress",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    athleteGoalId: uuid("athlete_goal_id")
      .notNull()
      .references(() => athleteGoal.id, { onDelete: "cascade" }),
    sessionId: uuid("session_id").references(() => session.id, {
      onDelete: "set null",
    }),
    sourceEntityId: uuid("source_entity_id"),
    sourceEntityType: text("source_entity_type"),
    value: numeric("value"),
    note: text("note"),
    createdAt: now(),
  },
  (t) => ({
    idx: index("ix_goal_progress_goal").on(t.athleteGoalId),
  })
);

export const workout = pgTable(
  "workout",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => org.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    type: text("type").references(() => workoutType.code),
    createdAt: now(),
    updatedAt: updated(),
  },
  (t) => ({
    ux: uniqueIndex("ux_workout_org_name").on(t.orgId, t.name),
  })
);

export const workoutVersion = pgTable(
  "workout_version",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workoutId: uuid("workout_id")
      .notNull()
      .references(() => workout.id, { onDelete: "cascade" }),
    versionNumber: integer("version_number").notNull(),
    status: text("status").default("active").notNull(),
    createdAt: now(),
    createdBy: uuid("created_by").references(() => userAccount.id),
  },
  (t) => ({
    ux: uniqueIndex("ux_workout_version").on(t.workoutId, t.versionNumber),
  })
);

export const workoutPart = pgTable("workout_part", {
  id: uuid("id").defaultRandom().primaryKey(),
  workoutId: uuid("workout_id")
    .notNull()
    .references(() => workout.id, { onDelete: "cascade" }),
  exerciseId: uuid("exercise_id")
    .notNull()
    .references(() => exercise.id),
  blockIndex: integer("block_index").default(0).notNull(),
  prescription: text("prescription"),
});

export const workoutPartVersion = pgTable("workout_part_version", {
  id: uuid("id").defaultRandom().primaryKey(),
  workoutVersionId: uuid("workout_version_id")
    .notNull()
    .references(() => workoutVersion.id, { onDelete: "cascade" }),
  exerciseId: uuid("exercise_id")
    .notNull()
    .references(() => exercise.id),
  blockIndex: integer("block_index").default(0).notNull(),
  prescription: text("prescription"),
});

export const program = pgTable("program", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: uuid("org_id")
    .notNull()
    .references(() => org.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  goal: text("goal"),
  totalWeeks: integer("total_weeks"),
  createdAt: now(),
  updatedAt: updated(),
});

export const programBlock = pgTable(
  "program_block",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    programId: uuid("program_id")
      .notNull()
      .references(() => program.id, { onDelete: "cascade" }),
    blockIndex: integer("block_index").notNull(),
    blockName: text("block_name"),
    focus: text("focus"),
    weekStart: integer("week_start"),
    weekEnd: integer("week_end"),
  },
  (t) => ({
    ux: uniqueIndex("ux_program_block").on(t.programId, t.blockIndex),
  })
);

export const programSession = pgTable(
  "program_session",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    programBlockId: uuid("program_block_id")
      .notNull()
      .references(() => programBlock.id, { onDelete: "cascade" }),
    dayOffset: integer("day_offset").notNull(),
    title: text("title"),
    notes: text("notes"),
    plannedSessionId: uuid("planned_session_id").references(
      () => plannedSession.id,
      { onDelete: "set null" }
    ),
  },
  (t) => ({
    ux: uniqueIndex("ux_program_session").on(t.programBlockId, t.dayOffset),
  })
);

export const plannedSession = pgTable(
  "planned_session",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => org.id, { onDelete: "cascade" }),
    athleteId: uuid("athlete_id")
      .notNull()
      .references(() => athlete.id, { onDelete: "cascade" }),
    plannedDate: date("planned_date").notNull(),
    title: text("title"),
    notes: text("notes"),
    createdAt: now(),
    updatedAt: updated(),
  },
  (t) => ({
    idx: index("ix_planned_by_athlete_date").on(t.athleteId, t.plannedDate),
  })
);

export const plannedSessionBlock = pgTable(
  "planned_session_block",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    plannedSessionId: uuid("planned_session_id")
      .notNull()
      .references(() => plannedSession.id, { onDelete: "cascade" }),
    blockIndex: integer("block_index").default(0).notNull(),
    blockType: text("block_type"),
    title: text("title"),
    notes: text("notes"),
  },
  (t) => ({
    ux: uniqueIndex("ux_planned_block").on(t.plannedSessionId, t.blockIndex),
  })
);

export const plannedSet = pgTable(
  "planned_set",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    plannedSessionBlockId: uuid("planned_session_block_id")
      .notNull()
      .references(() => plannedSessionBlock.id, { onDelete: "cascade" }),
    exerciseId: uuid("exercise_id")
      .notNull()
      .references(() => exercise.id),
    setIndex: integer("set_index").default(0).notNull(),
    targetReps: integer("target_reps"),
    targetLoadKg: numeric("target_load_kg"),
    targetDurationS: numeric("target_duration_s"),
    prescription: text("prescription"),
  },
  (t) => ({
    ux: uniqueIndex("ux_planned_set").on(t.plannedSessionBlockId, t.setIndex),
  })
);

export const plannedWorkout = pgTable("planned_workout", {
  id: uuid("id").defaultRandom().primaryKey(),
  plannedSessionBlockId: uuid("planned_session_block_id")
    .notNull()
    .references(() => plannedSessionBlock.id, { onDelete: "cascade" }),
  workoutId: uuid("workout_id")
    .notNull()
    .references(() => workout.id),
  targetResult: text("target_result"),
});

export const session = pgTable(
  "session",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => org.id, { onDelete: "cascade" }),
    athleteId: uuid("athlete_id")
      .notNull()
      .references(() => athlete.id, { onDelete: "cascade" }),
    plannedSessionId: uuid("planned_session_id").references(
      () => plannedSession.id
    ),
    trainingLocationId: uuid("training_location_id").references(
      () => trainingLocation.id
    ),
    sessionDate: date("session_date").notNull(),
    status: text("status").references(() => sessionStatus.code),
    completionPct: integer("completion_pct").default(0).notNull(),
    loadSource: text("load_source"),
    createdAt: now(),
    updatedAt: updated(),
  },
  (t) => ({
    idx: index("ix_session_athlete_date").on(t.athleteId, t.sessionDate),
  })
);

export const sessionBlock = pgTable(
  "session_block",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => session.id, { onDelete: "cascade" }),
    blockIndex: integer("block_index").default(0).notNull(),
    blockType: text("block_type"),
    title: text("title"),
    notes: text("notes"),
  },
  (t) => ({
    ux: uniqueIndex("ux_session_block").on(t.sessionId, t.blockIndex),
  })
);

export const setLog = pgTable(
  "set_log",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => session.id, { onDelete: "cascade" }),
    sessionBlockId: uuid("session_block_id").references(() => sessionBlock.id, {
      onDelete: "set null",
    }),
    exerciseId: uuid("exercise_id")
      .notNull()
      .references(() => exercise.id),
    plannedSetId: uuid("planned_set_id").references(() => plannedSet.id),
    setIndex: integer("set_index").default(0).notNull(),
    reps: integer("reps"),
    loadKg: numeric("load_kg"),
    durationS: numeric("duration_s"),
    distanceM: numeric("distance_m"),
    rpe: numeric("rpe"),
    toFailure: boolean("to_failure"),
  },
  (t) => ({
    idx: index("ix_setlog_session").on(t.sessionId, t.setIndex),
  })
);

export const workoutLog = pgTable("workout_log", {
  id: uuid("id").defaultRandom().primaryKey(),
  sessionId: uuid("session_id")
    .notNull()
    .references(() => session.id, { onDelete: "cascade" }),
  sessionBlockId: uuid("session_block_id").references(() => sessionBlock.id, {
    onDelete: "set null",
  }),
  workoutId: uuid("workout_id")
    .notNull()
    .references(() => workout.id),
  plannedWorkoutId: uuid("planned_workout_id").references(
    () => plannedWorkout.id
  ),
  workoutVersionId: uuid("workout_version_id").references(
    () => workoutVersion.id
  ),
  resultRaw: text("result_raw"),
  resultPrimary: numeric("result_primary"),
  asRx: boolean("as_rx").default(false).notNull(),
  isDraft: boolean("is_draft").default(false).notNull(),
});

export const workoutRoundLog = pgTable(
  "workout_round_log",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workoutLogId: uuid("workout_log_id")
      .notNull()
      .references(() => workoutLog.id, { onDelete: "cascade" }),
    roundIndex: integer("round_index").notNull(),
    durationS: numeric("duration_s"),
    repsTotal: integer("reps_total"),
    notes: text("notes"),
  },
  (t) => ({
    ux: uniqueIndex("ux_round_per_workout").on(t.workoutLogId, t.roundIndex),
  })
);

export const workoutRoundEntryLog = pgTable("workout_round_entry_log", {
  id: uuid("id").defaultRandom().primaryKey(),
  workoutRoundLogId: uuid("workout_round_log_id")
    .notNull()
    .references(() => workoutRoundLog.id, { onDelete: "cascade" }),
  exerciseId: uuid("exercise_id")
    .notNull()
    .references(() => exercise.id),
  reps: integer("reps"),
  loadKg: numeric("load_kg"),
  extra: jsonb("extra"),
});

export const workoutLogEntry = pgTable(
  "workout_log_entry",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workoutLogId: uuid("workout_log_id")
      .notNull()
      .references(() => workoutLog.id, { onDelete: "cascade" }),
    exerciseId: uuid("exercise_id")
      .notNull()
      .references(() => exercise.id),
    sequenceIndex: integer("sequence_index").default(0).notNull(),
    reps: integer("reps"),
    loadKg: numeric("load_kg"),
    scaled: boolean("scaled").default(false).notNull(),
    scaledToExerciseId: uuid("scaled_to_exercise_id").references(
      () => exercise.id
    ),
    actualPrescription: jsonb("actual_prescription"),
    equipmentExtra: jsonb("equipment_extra"),
  },
  (t) => ({
    ux: uniqueIndex("ux_wle_sequence").on(t.workoutLogId, t.sequenceIndex),
  })
);

export const workoutLogEntryEquipment = pgTable("workout_log_entry_equipment", {
  id: uuid("id").defaultRandom().primaryKey(),
  workoutLogEntryId: uuid("workout_log_entry_id")
    .notNull()
    .references(() => workoutLogEntry.id, { onDelete: "cascade" }),
  equipmentId: uuid("equipment_id").references(() => equipment.id),
  trainingLocationEquipmentId: uuid(
    "training_location_equipment_id"
  ).references(() => trainingLocationEquipment.id),
  specsOverride: jsonb("specs_override"),
});

export const intervalLog = pgTable(
  "interval_log",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => session.id, { onDelete: "cascade" }),
    sessionBlockId: uuid("session_block_id").references(() => sessionBlock.id),
    exerciseId: uuid("exercise_id").references(() => exercise.id),
    intervalIndex: integer("interval_index").notNull(),
    targetValue: jsonb("target_value"),
    actualValue: jsonb("actual_value"),
    durationS: numeric("duration_s"),
    notes: text("notes"),
  },
  (t) => ({
    ux: uniqueIndex("ux_interval_per_block").on(
      t.sessionBlockId,
      t.intervalIndex
    ),
  })
);

export const skillLog = pgTable("skill_log", {
  id: uuid("id").defaultRandom().primaryKey(),
  sessionId: uuid("session_id")
    .notNull()
    .references(() => session.id, { onDelete: "cascade" }),
  sessionBlockId: uuid("session_block_id").references(() => sessionBlock.id),
  exerciseId: uuid("exercise_id").references(() => exercise.id),
  attempts: integer("attempts"),
  successes: integer("successes"),
  qualityScore: numeric("quality_score"),
  notes: text("notes"),
});

export const progressionRule = pgTable("progression_rule", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: uuid("org_id")
    .notNull()
    .references(() => org.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  appliesTo: text("applies_to"), // 'exercise' | 'workout' etc.
  exerciseId: uuid("exercise_id").references(() => exercise.id, {
    onDelete: "set null",
  }),
  workoutId: uuid("workout_id").references(() => workout.id, {
    onDelete: "set null",
  }),
  conditionJson: jsonb("condition_json"),
  active: boolean("active").default(true).notNull(),
});

export const progressionRun = pgTable("progression_run", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: uuid("org_id")
    .notNull()
    .references(() => org.id, { onDelete: "cascade" }),
  progressionRuleId: uuid("progression_rule_id")
    .notNull()
    .references(() => progressionRule.id, { onDelete: "cascade" }),
  executedAt: timestamp("executed_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  status: text("status"),
  context: jsonb("context"),
});

export const progressionAction = pgTable("progression_action", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: uuid("org_id")
    .notNull()
    .references(() => org.id, { onDelete: "cascade" }),
  progressionRuleId: uuid("progression_rule_id")
    .notNull()
    .references(() => progressionRule.id, { onDelete: "cascade" }),
  progressionRunId: uuid("progression_run_id")
    .notNull()
    .references(() => progressionRun.id, { onDelete: "cascade" }),
  actionType: text("action_type").notNull(),
  actionPayload: jsonb("action_payload"),
});

export const conversation = pgTable("conversation", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: uuid("org_id")
    .notNull()
    .references(() => org.id, { onDelete: "cascade" }),
  subject: text("subject"),
  type: text("type"),
  createdAt: now(),
});

export const conversationParticipant = pgTable(
  "conversation_participant",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversation.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => userAccount.id, { onDelete: "cascade" }),
    isPinned: boolean("is_pinned").default(false).notNull(),
    joinedAt: timestamp("joined_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    ux: uniqueIndex("ux_conv_participant").on(t.conversationId, t.userId),
  })
);

export const message = pgTable("message", {
  id: uuid("id").defaultRandom().primaryKey(),
  conversationId: uuid("conversation_id")
    .notNull()
    .references(() => conversation.id, { onDelete: "cascade" }),
  senderUserId: uuid("sender_user_id")
    .notNull()
    .references(() => userAccount.id),
  body: text("body").notNull(),
  metadata: jsonb("metadata"),
  sentAt: timestamp("sent_at", { withTimezone: true }).defaultNow().notNull(),
});

export const messageRead = pgTable(
  "message_read",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    messageId: uuid("message_id")
      .notNull()
      .references(() => message.id, { onDelete: "cascade" }),
    conversationParticipantId: uuid("conversation_participant_id")
      .notNull()
      .references(() => conversationParticipant.id, { onDelete: "cascade" }),
    readAt: timestamp("read_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    ux: uniqueIndex("ux_message_read_once").on(
      t.messageId,
      t.conversationParticipantId
    ),
  })
);

export const commentThread = pgTable(
  "comment_thread",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => org.id, { onDelete: "cascade" }),
    entityType: text("entity_type")
      .notNull()
      .references(() => entityKind.code),
    entityId: uuid("entity_id").notNull(),
    createdAt: now(),
  },
  (t) => ({
    idx: index("ix_comment_thread_entity").on(
      t.orgId,
      t.entityType,
      t.entityId
    ),
  })
);

export const comment = pgTable("comment", {
  id: uuid("id").defaultRandom().primaryKey(),
  threadId: uuid("thread_id")
    .notNull()
    .references(() => commentThread.id, { onDelete: "cascade" }),
  authorUserId: uuid("author_user_id")
    .notNull()
    .references(() => userAccount.id),
  content: text("content").notNull(),
  visibility: text("visibility").default("org").notNull(), // 'org','private','public'
  createdAt: now(),
  updatedAt: updated(),
});

export const attachment = pgTable(
  "attachment",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => org.id, { onDelete: "cascade" }),
    entityType: text("entity_type")
      .notNull()
      .references(() => entityKind.code),
    entityId: uuid("entity_id").notNull(),
    url: text("url").notNull(),
    fileType: text("file_type"),
    title: text("title"),
    createdAt: now(),
    uploadedBy: uuid("uploaded_by").references(() => userAccount.id),
  },
  (t) => ({
    idx: index("ix_attachment_entity").on(t.orgId, t.entityType, t.entityId),
  })
);

export const coachNote = pgTable("coach_note", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: uuid("org_id")
    .notNull()
    .references(() => org.id, { onDelete: "cascade" }),
  authorUserId: uuid("author_user_id")
    .notNull()
    .references(() => userAccount.id),
  entityType: text("entity_type").notNull(),
  entityId: uuid("entity_id").notNull(),
  isPrivate: boolean("is_private").default(false).notNull(),
  visibility: text("visibility").default("org").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const domainEvent = pgTable(
  "domain_event",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => org.id, { onDelete: "cascade" }),
    eventType: text("event_type").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: uuid("entity_id").notNull(),
    sourceSystem: text("source_system"),
    isPublic: boolean("is_public").default(false).notNull(),
    payload: jsonb("payload"),
    occurredAt: timestamp("occurred_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    processedAt: timestamp("processed_at", { withTimezone: true }),
  },
  (t) => ({
    idx: index("ix_event_type_time").on(t.orgId, t.eventType, t.occurredAt),
  })
);

export const analyticsSessionFact = pgTable("analytics_session_fact", {
  sessionId: uuid("session_id")
    .primaryKey()
    .references(() => session.id, { onDelete: "cascade" }),
  orgId: uuid("org_id")
    .notNull()
    .references(() => org.id),
  athleteId: uuid("athlete_id")
    .notNull()
    .references(() => athlete.id),
  sessionDate: date("session_date").notNull(),
  trainingLocationId: uuid("training_location_id").references(
    () => trainingLocation.id
  ),
  totalSets: integer("total_sets"),
  totalVolumeKg: numeric("total_volume_kg"),
  totalDurationS: numeric("total_duration_s"),
  avgRpe: numeric("avg_rpe"),
  dominantMovementGroup: text("dominant_movement_group"),
  sourceProgramName: text("source_program_name"),
  completionPct: integer("completion_pct"),
  computedAt: timestamp("computed_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const analyticsAthleteDay = pgTable(
  "analytics_athlete_day",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => org.id),
    athleteId: uuid("athlete_id")
      .notNull()
      .references(() => athlete.id),
    day: date("day").notNull(),
    dayVolumeKg: numeric("day_volume_kg"),
    dayTimeS: numeric("day_time_s"),
    rolling7dVolumeKg: numeric("rolling_7d_volume_kg"),
    rolling28dVolumeKg: numeric("rolling_28d_volume_kg"),
    hrvMs: numeric("hrv_ms"),
    sleepH: numeric("sleep_h"),
    wellnessScore: numeric("wellness_score"),
    computedAt: timestamp("computed_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    ux: uniqueIndex("ux_analytics_athlete_day").on(t.athleteId, t.day),
  })
);

export const analyticsWorkoutFact = pgTable("analytics_workout_fact", {
  workoutLogId: uuid("workout_log_id")
    .primaryKey()
    .references(() => workoutLog.id, { onDelete: "cascade" }),
  orgId: uuid("org_id")
    .notNull()
    .references(() => org.id),
  athleteId: uuid("athlete_id")
    .notNull()
    .references(() => athlete.id),
  workoutId: uuid("workout_id")
    .notNull()
    .references(() => workout.id),
  workoutType: text("workout_type"),
  resultPrimary: numeric("result_primary"),
  durationS: numeric("duration_s"),
  workDensity: numeric("work_density"),
  movementBreakdown: jsonb("movement_breakdown"),
  computedAt: timestamp("computed_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const analyticsEventFact = pgTable(
  "analytics_event_fact",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => org.id),
    eventType: text("event_type").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: uuid("entity_id").notNull(),
    occurredAt: timestamp("occurred_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    sourceSystem: text("source_system"),
  },
  (t) => ({
    idx: index("ix_analytics_event").on(t.orgId, t.eventType, t.occurredAt),
  })
);

export const userRelations = relations(userAccount, ({ many }) => ({
  memberships: many(orgMember),
  identities: many(externalIdentity),
}));

export const orgRelations = relations(org, ({ many, one }) => ({
  members: many(orgMember),
  settings: one(orgSettings, {
    fields: [org.id],
    references: [orgSettings.orgId],
  }),
  exercises: many(exercise),
}));

export const athleteRelations = relations(athlete, ({ one, many }) => ({
  trainingLinks: many(athleteTrainingLocation),
  visibility: many(athleteVisibility),
}));

export const athleteTrainingLocationRelations = relations(
  athleteTrainingLocation,
  ({ one }) => ({
    athlete: one(athlete, {
      fields: [athleteTrainingLocation.athleteId],
      references: [athlete.id],
    }),
    trainingLocation: one(trainingLocation, {
      fields: [athleteTrainingLocation.trainingLocationId],
      references: [trainingLocation.id],
    }),
  })
);

export const athleteVisibilityRelations = relations(
  athleteVisibility,
  ({ one }) => ({
    athlete: one(athlete, {
      fields: [athleteVisibility.athleteId],
      references: [athlete.id],
    }),
    user: one(userAccount, {
      fields: [athleteVisibility.userId],
      references: [userAccount.id],
    }),
  })
);
