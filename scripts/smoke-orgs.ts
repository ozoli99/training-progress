import "dotenv/config";
import {
  createOrgService,
  listOrgsService,
  fetchOrgService,
  upsertOrgSettingsService,
  addMemberService,
  listMembersService,
} from "@/features/orgs/service";

async function main() {
  const org = await createOrgService({
    name: "Chaos Labs",
    ownerUserId: undefined,
  });
  console.log("Created org:", org);

  const list = await listOrgsService({ limit: 10, offset: 0 });
  console.log(
    "Orgs:",
    list.map((o) => o.name)
  );

  const settings = await upsertOrgSettingsService(org.id, {
    timezone: "Europe/Budapest",
    units: "metric",
  });
  console.log("Settings:", settings);

  const fetched = await fetchOrgService(org.id);
  console.log("Fetched:", fetched);
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
