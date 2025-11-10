import type { AuthContext } from "@/features/auth/context";
import { programsService } from "../service";
import { AppError } from "@/shared/errors";
import type {
  TListProgramsInput,
  TGetProgramInput,
  TListBlocksInput,
  TListSessionsInput,
  TProgramRow,
  TProgramBlockRow,
  TProgramSessionRow,
} from "../dto";

function requireOrgId(ctx: { orgId: string | null }): string {
  if (!ctx.orgId) throw new AppError.Forbidden("Org context is missing.");
  return ctx.orgId;
}

export async function qListPrograms(
  ctx: AuthContext,
  params: Omit<TListProgramsInput, "orgId">
): Promise<TProgramRow[]> {
  const orgId = requireOrgId(ctx);
  return programsService.list({ orgId, ...params });
}

export async function qGetProgram(
  ctx: AuthContext,
  params: Omit<TGetProgramInput, "orgId">
): Promise<TProgramRow> {
  const orgId = requireOrgId(ctx);
  return programsService.getById({ orgId, programId: params.programId });
}

export async function qListProgramBlocks(
  ctx: AuthContext,
  params: Omit<TListBlocksInput, "orgId">
): Promise<TProgramBlockRow[]> {
  const orgId = requireOrgId(ctx);
  return programsService.listBlocks({ orgId, programId: params.programId });
}

export async function qListProgramSessions(
  ctx: AuthContext,
  params: Omit<TListSessionsInput, "orgId">
): Promise<TProgramSessionRow[]> {
  const orgId = requireOrgId(ctx);
  return programsService.listSessions({
    orgId,
    programId: params.programId,
    programBlockId: params.programBlockId,
  });
}
