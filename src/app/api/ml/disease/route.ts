import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { detectDisease } from "@/lib/disease";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const contentType = req.headers.get("content-type") || "";
  if (!contentType.includes("multipart/form-data")) {
    return NextResponse.json(
      { error: "Send image as multipart/form-data with field 'file'" },
      { status: 400 }
    );
  }
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "Image too large (max 5 MB)" }, { status: 413 });
  }
  const buf = await file.arrayBuffer();
  try {
    const prediction = await detectDisease(buf);
    return NextResponse.json({ prediction });
  } catch (err) {
    console.error("[ml/disease] error", err);
    return NextResponse.json({ error: "Detection failed" }, { status: 502 });
  }
}
