import { NextResponse } from "next/server";
import { z } from "zod";
import { dbConnect } from "@/lib/db";
import { User } from "@/models/User";
import { hashPassword, signToken, setSessionCookie } from "@/lib/auth";

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
    await dbConnect();
    const { email, name, password, phone, preferredLanguage } = parsed.data;
    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }
    const passwordHash = await hashPassword(password);
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      phone,
      preferredLanguage,
    });
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
    console.error("[signup] error", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
