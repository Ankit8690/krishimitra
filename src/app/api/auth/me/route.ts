import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { dbConnect } from "@/lib/db";
import { User } from "@/models/User";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ user: null }, { status: 200 });
  await dbConnect();
  const user = await User.findById(session.sub).exec();
  if (!user) return NextResponse.json({ user: null }, { status: 200 });
  return NextResponse.json({
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      phone: user.phone,
      preferredLanguage: user.preferredLanguage,
      location: user.location,
      farm: user.farm,
      onboardingCompleted: user.onboardingCompleted,
      chatPrefs: user.chatPrefs ?? { readAloud: "ask" },
    },
  });
}
