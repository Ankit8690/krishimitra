import { NextResponse } from "next/server";
import { z } from "zod";
import { dbConnect } from "@/lib/db";
import { PendingSignup } from "@/models/PendingSignup";
import { generateOtp, hashOtp, rateLimit, shouldReturnOtpInResponse } from "@/lib/otp";
import { sendMail, otpEmailBody } from "@/lib/mailer";

const Body = z.object({ email: z.string().email() });

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const email = parsed.data.email.toLowerCase();

  const rl = rateLimit(`resend:${email}`, 3, 10 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: `Too many resends. Try again in ${rl.retryInSec}s.` },
      { status: 429 }
    );
  }

  await dbConnect();
  const pending = await PendingSignup.findOne({ email }).exec();
  if (!pending) {
    return NextResponse.json({ error: "No pending signup for this email." }, { status: 404 });
  }

  const otp = generateOtp();
  pending.otpHash = await hashOtp(otp);
  pending.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
  pending.attempts = 0;
  pending.resends = (pending.resends ?? 0) + 1;
  await pending.save();

  const body = otpEmailBody(pending.name, otp);
  const mail = await sendMail({
    to: email,
    subject: `KrishiMitra: your new verification code is ${otp}`,
    text: body.text,
    html: body.html,
  });

  const response: Record<string, unknown> = { ok: true, emailSent: mail.sent, via: mail.via };
  if (shouldReturnOtpInResponse()) response.devOtp = otp;
  return NextResponse.json(response);
}
