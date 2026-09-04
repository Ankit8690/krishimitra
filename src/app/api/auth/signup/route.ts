import { NextResponse } from "next/server";
import { z } from "zod";
import { dbConnect } from "@/lib/db";
import { User } from "@/models/User";
import { PendingSignup } from "@/models/PendingSignup";
import { hashPassword } from "@/lib/auth";
import { generateOtp, hashOtp, rateLimit, shouldReturnOtpInResponse } from "@/lib/otp";
import { sendMail, otpEmailBody, isEmailConfigured } from "@/lib/mailer";

const Body = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(6).max(200),
  phone: z.string().optional(),
  preferredLanguage: z.enum(["en", "hi", "pa"]).default("en"),
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = Body.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { email, name, password, phone, preferredLanguage } = parsed.data;
    const emailLower = email.toLowerCase();

    // Rate-limit: max 3 signup attempts per email per 10 min
    const rl = rateLimit(`signup:${emailLower}`, 3, 10 * 60 * 1000);
    if (!rl.ok) {
      return NextResponse.json(
        { error: `Too many attempts. Try again in ${rl.retryInSec}s.` },
        { status: 429 }
      );
    }

    await dbConnect();

    const exists = await User.findOne({ email: emailLower });
    if (exists) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const otp = generateOtp();
    const otpHash = await hashOtp(otp);
    const passwordHash = await hashPassword(password);
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    // Upsert pending — overwrites any prior pending attempt for this email
    await PendingSignup.findOneAndUpdate(
      { email: emailLower },
      {
        email: emailLower,
        name,
        phone,
        passwordHash,
        preferredLanguage,
        otpHash,
        otpExpiresAt,
        attempts: 0,
        resends: 0,
        createdAt: new Date(), // reset TTL clock
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const body = otpEmailBody(name, otp);
    const mail = await sendMail({
      to: emailLower,
      subject: `KrishiMitra: your verification code is ${otp}`,
      text: body.text,
      html: body.html,
    });

    const response: Record<string, unknown> = {
      pending: true,
      email: emailLower,
      emailSent: mail.sent,
      via: mail.via,
      configured: isEmailConfigured(),
    };
    if (shouldReturnOtpInResponse()) {
      response.devOtp = otp;
      response.devHint = "SMTP not configured — using dev OTP. Check server console.";
    }
    return NextResponse.json(response);
  } catch (err) {
    console.error("[signup] error", err);
    const detail = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: "Server error", detail }, { status: 500 });
  }
}
