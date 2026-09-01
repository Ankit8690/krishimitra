import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { dbConnect } from "@/lib/db";
import { User } from "@/models/User";
import { rankedSchemes } from "@/lib/schemes";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await dbConnect();
  const user = await User.findById(session.sub).exec();
  const schemes = rankedSchemes({
    state: user?.location?.state ?? undefined,
    landAcres: user?.farm?.landSizeAcres ?? undefined,
    landOwner: true,
    crops: (user?.farm?.primaryCrops as string[] | undefined) ?? [],
  });
  return NextResponse.json({ schemes });
}
