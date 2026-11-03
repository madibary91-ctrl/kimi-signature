import { randomInt } from "node:crypto";
import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { otpChallenges } from "@/db/schema";
import { ensureSeed } from "@/db/seed";
import { getContractRecord, getSettings, logAudit, sha256 } from "@/lib/server";

const normalizeDigits = (value: string) => value.replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d))).replace(/\D/g, "");
const codeHash = (code: string, contractId: string, signerId: string) => sha256(`${code}:${contractId}:${signerId}:${process.env.OTP_SECRET || "emzagar-local-otp"}`);

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  await ensureSeed();
  const { id } = await params;
  const body = await request.json() as { action?: "send" | "verify"; signerId?: string; code?: string; challengeId?: string };
  const contract = await getContractRecord(id);
  if (!contract) return NextResponse.json({ error: "قرارداد پیدا نشد." }, { status: 404 });
  const signer = contract.signers[contract.currentSigner];
  if (!signer || signer.id !== body.signerId || contract.status !== "pending") return NextResponse.json({ error: "نوبت این امضاکننده فعال نیست." }, { status: 409 });
  const config = await getSettings();
  if (!config.otpRequired || !config.enabledModules.includes("identity")) return NextResponse.json({ error: "احراز هویت برای این میزکار غیرفعال است." }, { status: 400 });

  if (body.action === "send") {
    const latest = await db.select().from(otpChallenges).where(and(eq(otpChallenges.contractId, id), eq(otpChallenges.signerId, signer.id))).orderBy(desc(otpChallenges.lastSentAt)).limit(1);
    if (latest.length) {
      const elapsed = Date.now() - latest[0].lastSentAt.getTime();
      const wait = config.resendSeconds * 1000 - elapsed;
      if (wait > 0) {
        return NextResponse.json({ error: `ارسال مجدد تا ${Math.ceil(wait / 1000)} ثانیه دیگر امکان‌پذیر است.`, remaining: Math.ceil(wait / 1000), challengeId: latest[0].id, developmentCode: config.smsProvider === "demo" ? latest[0].developmentCode : undefined }, { status: 429 });
      }
    }
    const code = String(randomInt(100000, 1000000));
    const isDemo = config.smsProvider === "demo";
    if (!isDemo) {
      const apiKey = process.env.KAVENEGAR_API_KEY;
      if (!apiKey) return NextResponse.json({ error: "کلید کاوه‌نگار روی سرور تنظیم نشده است. برای آزمون، درگاه آزمایشی را انتخاب کنید." }, { status: 503 });
      const response = await fetch(`https://api.kavenegar.com/v1/${apiKey}/sms/send.json`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ receptor: signer.phone, message: `امضاگیر\nکد تأیید امضای قرارداد ${contract.number}: ${code}\nاین کد تا ${Math.floor(config.otpExpirySeconds / 60)} دقیقه معتبر است.`, ...(process.env.KAVENEGAR_SENDER ? { sender: process.env.KAVENEGAR_SENDER } : {}) }),
      }).catch(() => null);
      if (!response) return NextResponse.json({ error: "ارتباط با سرویس کاوه‌نگار برقرار نشد." }, { status: 502 });
      const result = await response.json() as { return?: { status?: number; message?: string } };
      if (!response.ok || (result.return?.status && result.return.status !== 200)) {
        return NextResponse.json({ error: result.return?.message || "ارسال پیامک توسط کاوه‌نگار ناموفق بود." }, { status: 502 });
      }
    }
    const now = new Date();
    const [challenge] = await db.insert(otpChallenges).values({
      contractId: id,
      signerId: signer.id,
      phone: signer.phone,
      codeHash: codeHash(code, id, signer.id),
      developmentCode: isDemo ? code : null,
      maxAttempts: config.maxAttempts,
      expiresAt: new Date(now.getTime() + config.otpExpirySeconds * 1000),
      lastSentAt: now,
    }).returning();
    await logAudit({ contractId: id, actor: isDemo ? "درگاه آزمایشی" : "کاوه‌نگار", action: "otp_sent", description: isDemo ? `کد آزمایشی برای ${signer.name} تولید شد؛ پیامک واقعی ارسال نشد.` : `کد احراز هویت برای ${signer.name} پیامک شد.`, request, metadata: { provider: config.smsProvider, challengeId: challenge.id } });
    return NextResponse.json({ challengeId: challenge.id, expiresIn: config.otpExpirySeconds, resendIn: config.resendSeconds, provider: config.smsProvider, developmentCode: isDemo ? code : undefined });
  }

  if (body.action === "verify") {
    if (!body.challengeId) return NextResponse.json({ error: "ابتدا کد تأیید را دریافت کنید." }, { status: 400 });
    const rows = await db.select().from(otpChallenges).where(and(eq(otpChallenges.id, body.challengeId), eq(otpChallenges.contractId, id), eq(otpChallenges.signerId, signer.id))).limit(1);
    if (!rows.length) return NextResponse.json({ error: "چالش احراز هویت معتبر نیست." }, { status: 404 });
    const challenge = rows[0];
    if (challenge.expiresAt.getTime() < Date.now()) return NextResponse.json({ error: "کد منقضی شده است؛ کد جدید دریافت کنید." }, { status: 410 });
    if (challenge.attempts >= challenge.maxAttempts) return NextResponse.json({ error: "تعداد تلاش‌های مجاز تمام شد؛ کد جدید دریافت کنید." }, { status: 429 });
    const code = normalizeDigits(body.code || "");
    if (code.length !== 6 || codeHash(code, id, signer.id) !== challenge.codeHash) {
      const attempts = challenge.attempts + 1;
      await db.update(otpChallenges).set({ attempts }).where(eq(otpChallenges.id, challenge.id));
      return NextResponse.json({ error: `کد صحیح نیست. ${Math.max(0, challenge.maxAttempts - attempts)} تلاش باقی مانده است.` }, { status: 400 });
    }
    await db.update(otpChallenges).set({ verified: true, verifiedAt: new Date() }).where(eq(otpChallenges.id, challenge.id));
    await logAudit({ contractId: id, actor: signer.name, action: "identity_verified", description: `هویت ${signer.name} برای امضای مرحله ${signer.order} تأیید شد.`, request, metadata: { challengeId: challenge.id } });
    return NextResponse.json({ verified: true, challengeId: challenge.id });
  }
  return NextResponse.json({ error: "عملیات نامعتبر است." }, { status: 400 });
}
