import { randomInt, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { contracts, templates, users } from "@/db/schema";
import type { Signer } from "@/lib/domain";
import { getSettings, logAudit, randomToken } from "@/lib/server";

export async function POST(request: Request) {
  const config = await getSettings();
  const secret = process.env.WOOCOMMERCE_WEBHOOK_SECRET;
  if (!secret || !config.woocommerceEnabled || !config.enabledModules.includes("woocommerce") || !config.enabledModules.includes("workflow")) {
    return NextResponse.json({ error: "پل ووکامرس فعال نیست یا WOOCOMMERCE_WEBHOOK_SECRET روی سرور تنظیم نشده است." }, { status: 503 });
  }
  const provided = request.headers.get("x-emzagar-secret") || "";
  const valid = provided.length === secret.length && timingSafeEqual(Buffer.from(provided), Buffer.from(secret));
  if (!valid) return NextResponse.json({ error: "کلید وب‌هوک معتبر نیست." }, { status: 401 });
  const body = await request.json() as { id?: number | string; order_key?: string; billing?: { first_name?: string; last_name?: string; email?: string; phone?: string }; line_items?: { product_id?: number | string }[] };
  if (!body.id || !body.billing?.email) return NextResponse.json({ error: "شناسه سفارش و ایمیل گیرنده الزامی است." }, { status: 400 });
  const productIds = (body.line_items || []).map((item) => String(item.product_id || ""));
  const mapping = config.productMappings.find((item) => productIds.includes(item.productId));
  if (!mapping) return NextResponse.json({ error: "برای محصولات این سفارش نگاشت قالب تعریف نشده است." }, { status: 422 });
  const idempotencyKey = `woocommerce:${body.id}:${mapping.templateId}`;
  const existing = await db.select().from(contracts).where(eq(contracts.source, idempotencyKey)).limit(1);
  if (existing.length) return NextResponse.json({ contractId: existing[0].id, number: existing[0].number, duplicate: true });
  const [templateRows, userRows] = await Promise.all([
    db.select().from(templates).where(eq(templates.id, mapping.templateId)).limit(1),
    db.select().from(users).where(eq(users.email, body.billing.email)).limit(1),
  ]);
  const template = templateRows[0];
  if (!template) return NextResponse.json({ error: "قالب نگاشت‌شده دیگر وجود ندارد." }, { status: 404 });
  const name = `${body.billing.first_name || ""} ${body.billing.last_name || ""}`.trim() || body.billing.email;
  const user = userRows[0] || (await db.insert(users).values({ name, email: body.billing.email, phone: body.billing.phone || "09000000000", role: "customer" }).returning())[0];
  const year = new Intl.DateTimeFormat("fa-IR-u-nu-latn", { year: "numeric" }).format(new Date());
  const number = `${config.contractPrefix}-${year}-${randomInt(10000, 100000)}`;
  const now = new Date();
  const signers: Signer[] = template.signerRoles.map((role, index) => ({ id: index === template.signerRoles.length - 1 ? user.id : randomToken(8), name: index === template.signerRoles.length - 1 ? user.name : `مسئول ${role}`, role, phone: user.phone, email: user.email, order: index + 1, status: index === 0 ? "active" : "waiting" }));
  const variables = { USER_NAME: user.name, COMPANY: user.company || "—", NATIONAL_ID: user.nationalId || "—", USER_EMAIL: user.email, CONTRACT_NUMBER: number, DATE: new Intl.DateTimeFormat("fa-IR", { dateStyle: "long" }).format(now), START_DATE: new Intl.DateTimeFormat("fa-IR", { dateStyle: "long" }).format(now), ORDER_ID: String(body.id), PROJECT_TITLE: template.title, AMOUNT: "طبق فاکتور ووکامرس", DELIVERY_DAYS: "طبق شرایط محصول" };
  const [created] = await db.insert(contracts).values({ number, title: `${template.title} — سفارش ${body.id}`, templateId: template.id, userId: user.id, templateVersion: template.version, content: template.content, variables, signers, source: idempotencyKey, issuedAt: now, expiresAt: new Date(now.getTime() + config.expiryDays * 86400000) }).returning();
  await logAudit({ contractId: created.id, actor: "وب‌هوک ووکامرس", action: "issued", description: `سفارش ${body.id} با نگاشت محصول به قرارداد ${number} تبدیل شد.`, request, metadata: { orderId: body.id, orderKey: body.order_key, idempotencyKey } });
  return NextResponse.json({ contractId: created.id, number, duplicate: false }, { status: 201 });
}
