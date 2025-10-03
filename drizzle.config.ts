import type { Config } from "drizzle-kit";
import "dotenv/config";

export default {
    schema: "./src/infrastructure/db/schema.ts",
    out: "./drizzle",
    dialect: "turso",
    dbCredentials: { url: "file:./data.sqlite" },
} satisfies Config;