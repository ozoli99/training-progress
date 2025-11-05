import "dotenv/config";
import { db } from "../src/infrastructure/db/client";
import { org } from "../src/infrastructure/db/schema";

async function main() {
  const rows = await db.select().from(org).limit(1);
  console.log("OK, sample org:", rows[0] ?? null);
}

main()
  .then(() => {
    console.log("DB connection OK");
    process.exit(0);
  })
  .catch((err) => {
    console.error("DB connection failed:", err);
    process.exit(1);
  });
