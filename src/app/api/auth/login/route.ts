import { NextResponse } from "next/server";
import { z } from "zod";
import { dbConnect } from "@/lib/db";
import { User } from "@/models/User";
import { verifyPassword, signToken, setSessionCookie } from "@/lib/auth";

const Body = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const parsed = Body.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    await dbConnect();
    const user = await User.findOne({ email: parsed.data.email.toLowerCase() })
      .select("+passwordHash")
      .exec();
    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }
    const ok = await verifyPassword(parsed.data.password, user.passwordHash);
    if (!ok) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }
    const token = signToken({ sub: user._id.toString(), email: user.email });
    await setSessionCookie(token);
    return NextResponse.json({
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        preferredLanguage: user.preferredLanguage,
        onboardingCompleted: user.onboardingCompleted,
      },
    });
  } catch (err) {
    console.error("[login] error", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
