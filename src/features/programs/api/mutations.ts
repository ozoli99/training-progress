import type { AuthContext } from "@/features/auth/context";
import { programsService } from "../service";
import { AppError } from "@/shared/errors";
import type {
  TCreateProgramInput,
  TPatchProgramInput,
  TDeleteProgramInput,
  TCreateBlockInput,
  TPatchBlockInput,
  TDeleteBlockInput,
  TCreateSessionInput,
  TPatchSessionInput,
  TDeleteSessionInput,
  TProgramRow,
  TProgramBlockRow,
  TProgramSessionRow,
} from "../dto";

function requireOrgId(ctx: { orgId: string | null }): string {
  if (!ctx.orgId) throw new AppError.Forbidden("Org context is missing.");
  return ctx.orgId;
}

export async function mCreateProgram(
  ctx: AuthContext,
  input: Omit<TCreateProgramInput, "orgId">
): Promise<TProgramRow> {
  const orgId = requireOrgId(ctx);
  return programsService.create({ orgId, ...input });
}

export async function mUpdateProgram(
  ctx: AuthContext,
  input: Omit<TPatchProgramInput, "orgId">
): Promise<TProgramRow> {
  const orgId = requireOrgId(ctx);
  return programsService.update({ orgId, ...input });
}

export async function mDeleteProgram(
  ctx: AuthContext,
  input: Omit<TDeleteProgramInput, "orgId">
): Promise<void> {
  const orgId = requireOrgId(ctx);
  return programsService.delete({ orgId, ...input });
}

export async function mCreateProgramBlock(
  ctx: AuthContext,
  input: Omit<TCreateBlockInput, "orgId">
): Promise<TProgramBlockRow> {
  const orgId = requireOrgId(ctx);
  return programsService.createBlock({ orgId, ...input });
}

export async function mUpdateProgramBlock(
  ctx: AuthContext,
  input: Omit<TPatchBlockInput, "orgId">
): Promise<TProgramBlockRow> {
  const orgId = requireOrgId(ctx);
  return programsService.updateBlock({ orgId, ...input });
}

export async function mDeleteProgramBlock(
  ctx: AuthContext,
  input: Omit<TDeleteBlockInput, "orgId">
): Promise<void> {
  const orgId = requireOrgId(ctx);
  return programsService.deleteBlock({ orgId, ...input });
}

export async function mCreateProgramSession(
  ctx: AuthContext,
  input: Omit<TCreateSessionInput, "orgId">
): Promise<TProgramSessionRow> {
  const orgId = requireOrgId(ctx);
  return programsService.createSession({ orgId, ...input });
}

export async function mUpdateProgramSession(
  ctx: AuthContext,
  input: Omit<TPatchSessionInput, "orgId">
): Promise<TProgramSessionRow> {
  const orgId = requireOrgId(ctx);
  return programsService.updateSession({ orgId, ...input });
}

export async function mDeleteProgramSession(
  ctx: AuthContext,
  input: Omit<TDeleteSessionInput, "orgId">
): Promise<void> {
  const orgId = requireOrgId(ctx);
  return programsService.deleteSession({ orgId, ...input });
}
