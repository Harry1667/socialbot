import { redirect } from "next/navigation";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function SocialMasterRootPage() {
  const first = await db.identity.findFirst({
    orderBy: { createdAt: "asc" },
    select: { slug: true },
  });

  if (!first) {
    redirect("/agent/socialmaster/i/new");
  }

  redirect(`/agent/socialmaster/i/${first.slug}`);
}
