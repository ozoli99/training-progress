import { z } from "zod";
import {
  EnsureUserAccountInput,
  UpsertOrgFromClerkInput,
  CreateOrgInput,
  ListUserOrgsInput,
  OrgWithSettings,
  OrgMembersResponse,
  SetOrgSettingsInput,
  AddMemberInput,
  RemoveMemberInput,
  ChangeMemberRoleInput,
  OrgRow,
  OrgSettingsRow,
} from "./dto";
import { orgsRepository, type OrgsRepository } from "./repository";

const isUuid = (s: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    s
  );

export function makeOrgsService(repository: OrgsRepository) {
  return {
    async ensureUserAccount(input: unknown): Promise<string> {
      const data = EnsureUserAccountInput.parse(input);
      return repository.ensureUserAccount(data);
    },

    async upsertOrgFromClerk(input: unknown) {
      const data = UpsertOrgFromClerkInput.parse(input);
      const row = await repository.upsertOrgFromClerk(data);
      return OrgRow.parse(row);
    },

    async listUserOrgs(input: unknown) {
      const data = ListUserOrgsInput.parse(input);
      const rows = await repository.listOrgsForUser(data);
      return rows.map((r) => OrgRow.parse(r));
    },

    async getOrgWithSettings(input: { orgId: string }) {
      const row = await repository.getOrgWithSettings(input.orgId);
      return row ? OrgWithSettings.parse(row) : null;
    },

    async getMembers(input: { orgId: string }) {
      const items = await repository.getMembers(input.orgId);
      return OrgMembersResponse.parse({ items });
    },

    async createOrg(input: unknown) {
      const data = CreateOrgInput.parse(input);
      const row = await repository.createOrg(data);
      return OrgRow.parse(row);
    },

    async setOrgSettings(input: unknown) {
      const data = SetOrgSettingsInput.parse(input);
      const row = await repository.setOrgSettings(data);
      return OrgSettingsRow.parse(row);
    },

    async addMember(input: unknown) {
      const data = AddMemberInput.parse(input);
      await repository.addMember(data);
    },

    async changeMemberRole(input: unknown) {
      const data = ChangeMemberRoleInput.parse(input);
      await repository.changeMemberRole(data);
    },

    async removeMember(input: unknown) {
      const data = RemoveMemberInput.parse(input);
      await repository.removeMember(data);
    },

    async resolveOrgByAnyId(input: {
      orgIdOrClerkId: string;
    }): Promise<z.infer<typeof OrgRow> | null> {
      const { orgIdOrClerkId } = input;
      if (isUuid(orgIdOrClerkId)) {
        const row = await repository.getOrgById(orgIdOrClerkId);
        return row ?? null;
      }
      const row = await repository.findByClerkOrgId(orgIdOrClerkId);
      return row ?? null;
    },
  };
}

export const orgsService = makeOrgsService(orgsRepository);
export type OrgsService = ReturnType<typeof makeOrgsService>;
