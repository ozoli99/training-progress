import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import MarketingHome from "@/components/marketing/MarketingHome";

export default async function LandingPage() {
  const { userId } = await auth();
  if (userId) redirect("/dashboard");

  return <MarketingHome />;
}
