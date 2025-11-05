import "dotenv/config";
import {
  createUser,
  fetchUser,
  listUsersService,
} from "@/features/users/service";

async function main() {
  const u = await createUser({
    email: "tester@example.com",
    fullName: "Test User",
  });
  console.log("Created:", u);

  const got = await fetchUser(u.id);
  console.log("Fetched:", got);

  const list = await listUsersService({ limit: 10, offset: 0 });
  console.log("List:", list.length);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
