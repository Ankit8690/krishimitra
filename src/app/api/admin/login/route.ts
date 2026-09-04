import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminCreds, signAdminToken, setAdminCookie } from "@/lib/adminAuth";

const Body = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const creds = getAdminCreds();
  if (!creds.email || !creds.password) {
    return NextResponse.json(
      { error: "Admin credentials not configured. Set ADMIN_EMAIL and ADMIN_PASSWORD in .env" },
      { status: 500 }
    );
  }

  const emailOk = parsed.data.email.toLowerCase() === creds.email;
  const passwordOk = parsed.data.password === creds.password;
  if (!emailOk || !passwordOk) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  const token = signAdminToken(creds.email);
  await setAdminCookie(token);
  return NextResponse.json({ ok: true });
}
