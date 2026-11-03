import { randomInt } from "node:crypto";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { contracts, templates, users } from "@/db/schema";
import { ensureSeed } from "@/db/seed";
import type { Signer } from "@/lib/domain";
import { getContractRecord, getSettings, logAudit, randomToken } from "@/lib/server";

type SignerInput = { name?: string; role?: string; phone?: string; email?: string };

export async function POST(request: Request) {
  await ensureSeed();
  const body = await request.json() as {
    templateId?: string;
    userId?: string;
    variables?: Record<string, string>;
    signers?: SignerInput[];
    expiryDays?: number;
    source?: string;
  };
  if (!body.templateId || !body.userId) return NextResponse.json({ error: "قالب و کاربر را انتخاب کنید." }, { status: 400 });
  const [templateRows, userRows, config] = await Promise.all([
    db.select().from(templates).where(eq(templates.id, body.templateId)).limit(1),
    db.select().from(users).where(eq(users.id, body.userId)).limit(1),
    getSettings(),
  ]);
  if (!config.enabledModules.includes("workflow")) return NextResponse.json({ error: "ماژول گردش‌کار قرارداد غیرفعال است." }, { status: 503 });
  if (!templateRows.length || !userRows.length) return NextResponse.json({ error: "قالب یا کاربر معتبر نیست." }, { status: 404 });
  const template = templateRows[0];
  const user = userRows[0];
  const inputs = body.signers?.length ? body.signers : template.signerRoles.map((role, index) => index === template.signerRoles.length - 1 ? { ...user, role } : { name: `مسئول ${role}`, role, phone: user.phone, email: user.email });
  if (inputs.some((item) => !item.name?.trim() || !item.role?.trim() || !item.phone?.trim())) {
    return NextResponse.json({ error: "نام، نقش و موبایل تمام امضاکنندگان الزامی است." }, { status: 400 });
  }
  const signers: Signer[] = inputs.map((item, index) => ({
    id: index === inputs.length - 1 ? user.id : randomToken(8),
    name: item.name!.trim(),
    role: item.role!.trim(),
    phone: item.phone!.trim(),
    email: item.email?.trim() || user.email,
    order: index + 1,
    status: index === 0 ? "active" : "waiting",
  }));
  const year = new Intl.DateTimeFormat("fa-IR-u-nu-latn", { year: "numeric" }).format(new Date());
  const number = `${config.contractPrefix}-${year}-${randomInt(10000, 100000)}`;
  const now = new Date();
  const variables: Record<string, string> = {
    USER_NAME: user.name,
    COMPANY: user.company || "—",
    NATIONAL_ID: user.nationalId || "—",
    USER_EMAIL: user.email,
    CONTRACT_NUMBER: number,
    DATE: new Intl.DateTimeFormat("fa-IR", { dateStyle: "long" }).format(now),
    START_DATE: new Intl.DateTimeFormat("fa-IR", { dateStyle: "long" }).format(now),
    ORDER_ID: "—",
    ...(body.variables || {}),
  };
  const unresolved = Array.from(template.content.matchAll(/\[([A-Z0-9_]+)\]/g)).map((match) => match[1]).filter((key) => !variables[key]?.trim());
  if (unresolved.length) return NextResponse.json({ error: `متغیرهای ${Array.from(new Set(unresolved)).join("، ")} مقدار ندارند.` }, { status: 400 });
  const expiryDays = Math.min(90, Math.max(1, Number(body.expiryDays) || config.expiryDays));
  const [created] = await db.insert(contracts).values({
    number,
    title: `${template.title} — ${user.name}`,
    templateId: template.id,
    userId: user.id,
    templateVersion: template.version,
    content: template.content,
    variables,
    signers,
    currentSigner: 0,
    status: "pending",
    source: body.source === "woocommerce" ? "woocommerce" : "manual",
    issuedAt: now,
    expiresAt: new Date(now.getTime() + expiryDays * 86400000),
  }).returning();
  await logAudit({ contractId: created.id, actor: body.source === "woocommerce" ? "سیستم ووکامرس" : "مدیر امضاگیر", action: "issued", description: `قرارداد ${number} با ${signers.length} امضاکننده صادر شد.`, request, metadata: { templateVersion: template.version, expiryDays } });
  if (config.smsProvider === "demo" && config.enabledModules.includes("notifications")) {
    await logAudit({ contractId: created.id, actor: "درگاه آزمایشی", action: "notification", description: "اعلان صدور در صف آزمایشی ثبت شد؛ هیچ پیامک واقعی ارسال نشد.", metadata: { provider: "demo" } });
  }
  return NextResponse.json({ contract: await getContractRecord(created.id) }, { status: 201 });
}
