import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { contracts } from "@/db/schema";
import { getContractRecord, getSettings, logAudit } from "@/lib/server";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const contract = await getContractRecord(id);
  if (!contract) return NextResponse.json({ error: "قرارداد پیدا نشد." }, { status: 404 });
  const config = await getSettings();
  return NextResponse.json({ contract, signing: { otpRequired: config.otpRequired && config.enabledModules.includes("identity"), pdfEnabled: config.pdfEnabled && config.enabledModules.includes("pdf"), smsProvider: config.smsProvider, resendSeconds: config.resendSeconds, emailConfigured: Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM && process.env.ADMIN_EMAIL) } });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json() as { action?: string };
  const contract = await getContractRecord(id);
  if (!contract) return NextResponse.json({ error: "قرارداد پیدا نشد." }, { status: 404 });
  if (body.action !== "cancel") return NextResponse.json({ error: "عملیات پشتیبانی نمی‌شود." }, { status: 400 });
  if (contract.status !== "pending") return NextResponse.json({ error: "فقط قرارداد در انتظار امضا قابل لغو است." }, { status: 409 });
  await db.update(contracts).set({ status: "cancelled", updatedAt: new Date() }).where(eq(contracts.id, id));
  await logAudit({ contractId: id, actor: "مدیر امضاگیر", action: "cancelled", description: `قرارداد ${contract.number} لغو و لینک امضای آن بسته شد.`, request });
  return NextResponse.json({ contract: await getContractRecord(id) });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const contract = await getContractRecord(id);
  if (!contract) return NextResponse.json({ error: "قرارداد پیدا نشد." }, { status: 404 });
  if (contract.status === "signed") return NextResponse.json({ error: "سند امضاشده برای حفظ ردپای حسابرسی قابل حذف نیست؛ ابتدا بایگانی کنید." }, { status: 409 });
  await db.delete(contracts).where(eq(contracts.id, id));
  await logAudit({ actor: "مدیر امضاگیر", action: "deleted", description: `قرارداد امضانشده ${contract.number} حذف شد.`, request, metadata: { deletedContractId: id, number: contract.number } });
  return NextResponse.json({ ok: true });
}
