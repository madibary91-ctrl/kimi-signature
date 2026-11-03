import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { contracts, otpChallenges } from "@/db/schema";
import { getContractRecord, getSettings, logAudit, requestContext, sha256 } from "@/lib/server";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json() as { signerId?: string; challengeId?: string; signatureData?: string; signatureMethod?: "draw" | "upload"; consent?: boolean };
  const contract = await getContractRecord(id);
  if (!contract) return NextResponse.json({ error: "قرارداد پیدا نشد." }, { status: 404 });
  if (contract.status !== "pending") return NextResponse.json({ error: "این قرارداد در وضعیت امضا نیست." }, { status: 409 });
  if (contract.expiresAt && new Date(contract.expiresAt).getTime() < Date.now()) {
    await db.update(contracts).set({ status: "expired", updatedAt: new Date() }).where(eq(contracts.id, id));
    return NextResponse.json({ error: "مهلت امضای قرارداد به پایان رسیده است." }, { status: 410 });
  }
  const signer = contract.signers[contract.currentSigner];
  if (!signer || signer.id !== body.signerId || signer.status !== "active") return NextResponse.json({ error: "نوبت امضای شما فعال نیست." }, { status: 409 });
  if (!body.consent) return NextResponse.json({ error: "تأیید مطالعه و پذیرش مفاد قرارداد الزامی است." }, { status: 400 });
  if (!body.signatureData || !/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(body.signatureData) || body.signatureData.length > 4_000_000) {
    return NextResponse.json({ error: "تصویر امضا معتبر نیست یا حجم آن بیش از حد مجاز است." }, { status: 400 });
  }
  if (body.signatureMethod !== "draw" && body.signatureMethod !== "upload") return NextResponse.json({ error: "روش امضا مشخص نیست." }, { status: 400 });
  const config = await getSettings();
  if (!config.enabledModules.includes("signature")) return NextResponse.json({ error: "ماژول ثبت امضا غیرفعال است." }, { status: 503 });
  if (config.otpRequired && config.enabledModules.includes("identity")) {
    if (!body.challengeId) return NextResponse.json({ error: "احراز هویت پیامکی تکمیل نشده است." }, { status: 403 });
    const challenges = await db.select().from(otpChallenges).where(and(eq(otpChallenges.id, body.challengeId), eq(otpChallenges.contractId, id), eq(otpChallenges.signerId, signer.id))).limit(1);
    const challenge = challenges[0];
    if (!challenge?.verified || !challenge.verifiedAt || Date.now() - challenge.verifiedAt.getTime() > 15 * 60 * 1000) {
      return NextResponse.json({ error: "نشست احراز هویت معتبر نیست یا منقضی شده است." }, { status: 403 });
    }
  }
  const context = requestContext(request);
  const now = new Date();
  const signers = [...contract.signers];
  signers[contract.currentSigner] = {
    ...signer,
    status: "signed",
    signedAt: now.toISOString(),
    signatureData: body.signatureData,
    signatureMethod: body.signatureMethod,
    ip: context.ip,
    userAgent: context.userAgent,
  };
  const isFinal = contract.currentSigner === signers.length - 1;
  if (!isFinal) signers[contract.currentSigner + 1] = { ...signers[contract.currentSigner + 1], status: "active" };
  const nextIndex = isFinal ? signers.length : contract.currentSigner + 1;
  const verificationHash = isFinal ? sha256(JSON.stringify({ number: contract.number, signedAt: now.toISOString(), signers: signers.map((item) => ({ id: item.id, signedAt: item.signedAt, signature: sha256(item.signatureData || "") })) })) : null;
  await db.update(contracts).set({
    signers,
    currentSigner: nextIndex,
    status: isFinal ? "signed" : "pending",
    signedAt: isFinal ? now : null,
    verificationHash,
    updatedAt: now,
  }).where(eq(contracts.id, id));
  await logAudit({ contractId: id, actor: signer.name, action: "signed", description: `امضای مرحله ${signer.order} (${signer.role}) با روش ${body.signatureMethod === "draw" ? "ترسیم" : "آپلود"} ثبت شد.`, request, metadata: { signerOrder: signer.order, method: body.signatureMethod, verificationHash } });
  if (isFinal) {
    await logAudit({ contractId: id, actor: "موتور گردش‌کار", action: "completed", description: `تمام امضاهای قرارداد ${contract.number} کامل و اثر انگشت نهایی سند ثبت شد.`, metadata: { verificationHash } });
  } else {
    await logAudit({ contractId: id, actor: "موتور گردش‌کار", action: "signer_advanced", description: `نوبت امضا به ${signers[nextIndex].name} (${signers[nextIndex].role}) منتقل شد.`, metadata: { nextSigner: signers[nextIndex].id } });
  }
  return NextResponse.json({ contract: await getContractRecord(id), completed: isFinal });
}
