import { NextResponse } from "next/server";
import { z } from "zod";
import { dbConnect } from "@/lib/db";
import { User } from "@/models/User";
import { verifyPassword, signToken, setSessionCookie } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { rateLimit } from "@/lib/otp";

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

    const emailLower = parsed.data.email.toLowerCase();

    // Rate limit: 8 login attempts per 10 min per email
    const rl = rateLimit(`login:${emailLower}`, 8, 10 * 60 * 1000);
    if (!rl.ok) {
      return NextResponse.json(
        { error: `Too many login attempts. Try again in ${rl.retryInSec}s.` },
        { status: 429 }
      );
    }

    await dbConnect();
    const user = await User.findOne({ email: emailLower }).select("+passwordHash").exec();
    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }
    const ok = await verifyPassword(parsed.data.password, user.passwordHash);
    if (!ok) {
      logActivity(user._id.toString(), "auth.login_failed", { reason: "wrong_password" });
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }
    if (user.disabled) {
      logActivity(user._id.toString(), "auth.login_failed", { reason: "account_disabled" });
      return NextResponse.json(
        { error: "Account disabled. Please contact support." },
        { status: 403 }
      );
    }
    const token = signToken({ sub: user._id.toString(), email: user.email });
    await setSessionCookie(token);

    logActivity(user._id.toString(), "auth.login_success", {});

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
