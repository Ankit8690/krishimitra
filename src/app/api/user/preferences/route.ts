import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { dbConnect } from "@/lib/db";
import { User } from "@/models/User";
import { CHAT_LANGUAGES } from "@/lib/languages";

const CHAT_LANG_CODES = CHAT_LANGUAGES.map((l) => l.code) as [string, ...string[]];

const Body = z.object({
  readAloud: z.enum(["ask", "always", "never"]).optional(),
  chatLanguage: z.enum(CHAT_LANG_CODES).optional(),
});

export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  await dbConnect();

  const $set: Record<string, unknown> = {};
  if (parsed.data.readAloud) $set["chatPrefs.readAloud"] = parsed.data.readAloud;
  if (parsed.data.chatLanguage) $set["chatPrefs.chatLanguage"] = parsed.data.chatLanguage;
  if (Object.keys($set).length === 0) {
    return NextResponse.json({ ok: true });
  }
  await User.findByIdAndUpdate(session.sub, { $set }).exec();
  return NextResponse.json({ ok: true });
}
