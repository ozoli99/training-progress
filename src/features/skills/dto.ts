// features/skills/dto.ts

export type TSkillLogRow = {
  id: string;
  orgId: string;
  athleteId: string;
  sessionId: string;
  sessionBlockId: string | null;
  exerciseId: string | null;
  attempts: number | null;
  successes: number | null;
  qualityScore: number | null;
  notes: string | null;
};

export type TListSkillsInput = {
  orgId: string;
  athleteId: string;
  sessionId: string;
  // Optional filters
  exerciseId?: string;
  minQualityScore?: number;
  maxQualityScore?: number;
};

export type TCreateSkillInput = {
  orgId: string;
  athleteId: string;
  sessionId: string;
  sessionBlockId?: string | null;
  exerciseId?: string | null;
  attempts?: number | null;
  successes?: number | null;
  qualityScore?: number | null;
  notes?: string | null;
};

export type TPatchSkillInput = {
  orgId: string;
  athleteId: string;
  sessionId: string;
  skillLogId: string;
  sessionBlockId?: string | null;
  exerciseId?: string | null;
  attempts?: number | null;
  successes?: number | null;
  qualityScore?: number | null;
  notes?: string | null;
};

export type TGetSkillInput = {
  orgId: string;
  athleteId: string;
  sessionId: string;
  skillLogId: string;
};

export type TDeleteSkillInput = TGetSkillInput;
