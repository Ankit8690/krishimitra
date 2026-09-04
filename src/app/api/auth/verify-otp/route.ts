import { NextResponse } from "next/server";
import { z } from "zod";
import { dbConnect } from "@/lib/db";
import { User } from "@/models/User";
import { PendingSignup } from "@/models/PendingSignup";
import { signToken, setSessionCookie } from "@/lib/auth";
import { verifyOtp } from "@/lib/otp";
import { logActivity } from "@/lib/activity";

const Body = z.object({
  email: z.string().email(),
  code: z.string().regex(/^\d{6}$/, "6-digit code"),
});

const MAX_ATTEMPTS = 5;

export async function POST(req: Request) {
  try {
    const parsed = Body.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    const email = parsed.data.email.toLowerCase();

    await dbConnect();
    const pending = await PendingSignup.findOne({ email }).exec();
    if (!pending) {
      return NextResponse.json({ error: "No pending signup. Please start again." }, { status: 404 });
    }

    if (pending.otpExpiresAt.getTime() < Date.now()) {
      return NextResponse.json({ error: "Code expired. Please request a new one." }, { status: 410 });
    }
    if (pending.attempts >= MAX_ATTEMPTS) {
      return NextResponse.json({ error: "Too many wrong attempts. Please request a new code." }, { status: 429 });
    }

    const ok = await verifyOtp(parsed.data.code, pending.otpHash);
    if (!ok) {
      pending.attempts += 1;
      await pending.save();
      const left = MAX_ATTEMPTS - pending.attempts;
      return NextResponse.json(
        { error: `Wrong code. ${left} attempt${left === 1 ? "" : "s"} left.` },
        { status: 401 }
      );
    }

    // Promote to real User
    const user = await User.create({
      name: pending.name,
      email: pending.email,
      passwordHash: pending.passwordHash,
      phone: pending.phone,
      preferredLanguage: pending.preferredLanguage,
      emailVerified: true,
    });
    await PendingSignup.deleteOne({ _id: pending._id }).exec();

    const token = signToken({ sub: user._id.toString(), email: user.email });
    await setSessionCookie(token);

    // Fire-and-forget log
    logActivity(user._id.toString(), "auth.signup_verified", { email: user.email });

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
    console.error("[verify-otp] error", err);
    const detail = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: "Server error", detail }, { status: 500 });
  }
}
