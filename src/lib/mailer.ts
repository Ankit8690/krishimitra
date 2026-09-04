// Email sender — Gmail SMTP via nodemailer with graceful console fallback.
// Set SMTP_USER (gmail addr) and SMTP_PASS (app password, not gmail password)
// in .env.local. Without those, OTPs are logged to console and returned in the
// API response (dev-only helper — safe because API only returns them when
// NODE_ENV !== "production").

import nodemailer, { type Transporter } from "nodemailer";

let cachedTransport: Transporter | null | undefined;

function getTransport(): Transporter | null {
  if (cachedTransport !== undefined) return cachedTransport;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!user || !pass) {
    cachedTransport = null;
    return null;
  }
  cachedTransport = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
  return cachedTransport;
}

export function isEmailConfigured() {
  return !!(process.env.SMTP_USER && process.env.SMTP_PASS);
}

export type MailResult = { sent: boolean; via: "smtp" | "console"; error?: string };

export async function sendMail(opts: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}): Promise<MailResult> {
  const t = getTransport();
  if (!t) {
    console.log("\n===== EMAIL (console fallback — no SMTP creds) =====");
    console.log("To:     ", opts.to);
    console.log("Subject:", opts.subject);
    console.log("Body:   ", opts.text);
    console.log("=====================================================\n");
    return { sent: false, via: "console" };
  }
  try {
    await t.sendMail({
      from: process.env.SMTP_FROM || `KrishiMitra <${process.env.SMTP_USER}>`,
      to: opts.to,
      subject: opts.subject,
      text: opts.text,
      html: opts.html,
    });
    return { sent: true, via: "smtp" };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[mailer] send failed:", msg);
    return { sent: false, via: "smtp", error: msg };
  }
}

export function otpEmailBody(name: string, code: string) {
  const text = `Hi ${name},\n\nYour KrishiMitra verification code is: ${code}\n\nThis code expires in 10 minutes.\n\nIf you did not request this, please ignore this email.`;
  const html = `
<div style="font-family:system-ui,Segoe UI,Roboto,sans-serif;max-width:480px;margin:auto;padding:24px;background:#f7f9f5;border-radius:12px;color:#111">
  <div style="text-align:center;margin-bottom:16px">
    <div style="display:inline-block;width:48px;height:48px;background:linear-gradient(135deg,#16a34a,#059669);border-radius:12px;color:#fff;line-height:48px;font-size:24px">🌾</div>
    <h2 style="margin:8px 0 0">KrishiMitra</h2>
    <p style="margin:0;color:#666;font-size:13px">Smart farming for every farmer</p>
  </div>
  <p>Hi ${name},</p>
  <p>Use this code to verify your account:</p>
  <div style="text-align:center;font-size:32px;letter-spacing:8px;font-weight:700;background:#fff;border:2px dashed #16a34a;padding:16px;border-radius:10px;color:#16a34a">${code}</div>
  <p style="color:#666;font-size:13px;margin-top:16px">This code expires in 10 minutes. If you did not request this, ignore this email.</p>
</div>`;
  return { text, html };
}
