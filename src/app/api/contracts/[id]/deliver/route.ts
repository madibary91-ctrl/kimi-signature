import { NextResponse } from "next/server";
import { getContractRecord, getSettings, logAudit } from "@/lib/server";

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char] || char);

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const contract = await getContractRecord(id);
  if (!contract) return NextResponse.json({ error: "قرارداد پیدا نشد." }, { status: 404 });
  if (contract.status !== "signed") return NextResponse.json({ error: "فقط سند نهایی امضاشده قابل ارسال است." }, { status: 409 });
  const config = await getSettings();
  if (!config.enabledModules.includes("notifications") || !config.pdfEnabled) return NextResponse.json({ error: "ماژول اطلاع‌رسانی یا PDF غیرفعال است." }, { status: 503 });
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!apiKey || !from || !adminEmail) return NextResponse.json({ error: "برای ارسال واقعی، RESEND_API_KEY، EMAIL_FROM و ADMIN_EMAIL باید روی سرور تنظیم شوند." }, { status: 503 });
  const body = await request.json() as { pdfBase64?: string };
  const base64 = body.pdfBase64 || "";
  if (base64.length < 100 || base64.length > 18_000_000 || !/^[A-Za-z0-9+/=]+$/.test(base64)) return NextResponse.json({ error: "پیوست PDF معتبر نیست یا بیش از حد بزرگ است." }, { status: 400 });
  const bytes = Buffer.from(base64, "base64");
  if (bytes.subarray(0, 4).toString() !== "%PDF") return NextResponse.json({ error: "محتوای پیوست یک فایل PDF نیست." }, { status: 400 });
  const recipients = [contract.user?.email, adminEmail].filter((email): email is string => Boolean(email));
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: recipients,
      subject: `نسخه نهایی قرارداد ${contract.number}`,
      html: `<div dir="rtl" style="font-family:Tahoma,Arial,sans-serif;line-height:2;color:#173236"><h2>قرارداد شما نهایی شد</h2><p>نسخه PDF قرارداد <strong>${escapeHtml(contract.title)}</strong> با شماره <strong>${escapeHtml(contract.number)}</strong> پیوست این ایمیل است.</p><p>اثر انگشت سند:</p><code dir="ltr" style="display:block;word-break:break-all;background:#f2f4ef;padding:12px">${contract.verificationHash || ""}</code><p style="font-size:12px;color:#687777">این ایمیل توسط سامانه امضاگیر ارسال شده است.</p></div>`,
      attachments: [{ filename: `${contract.number}.pdf`, content: base64 }],
    }),
  }).catch(() => null);
  if (!response) return NextResponse.json({ error: "ارتباط با سرویس Resend برقرار نشد." }, { status: 502 });
  const result = await response.json() as { id?: string; message?: string; name?: string };
  if (!response.ok) return NextResponse.json({ error: result.message || result.name || "ارسال ایمیل توسط Resend ناموفق بود." }, { status: 502 });
  await logAudit({ contractId: id, actor: "Resend", action: "email_delivered", description: `PDF نهایی برای کاربر و مدیر ارسال شد.`, request, metadata: { messageId: result.id, recipients: recipients.map((email) => email.replace(/(.{2}).*(@.*)/, "$1…$2")) } });
  return NextResponse.json({ ok: true, messageId: result.id, recipients: recipients.length });
}
