import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { contracts, templates, users } from "@/db/schema";
import { ensureSeed } from "@/db/seed";
import { expireDueContracts, getSettings, logAudit, serializeContract, serializeUser } from "@/lib/server";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ userId: string }> }) {
  await ensureSeed();
  await expireDueContracts();
  const { userId } = await params;
  const userRows = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!userRows.length) return NextResponse.json({ error: "حساب کاربری پیدا نشد." }, { status: 404 });
  const [contractRows, templateRows, config] = await Promise.all([
    db.select().from(contracts).where(eq(contracts.userId, userId)).orderBy(desc(contracts.createdAt)),
    db.select().from(templates),
    getSettings(),
  ]);
  const user = serializeUser(userRows[0]);
  const templateMap = new Map(templateRows.map((template) => [template.id, template.title]));
  return NextResponse.json({ user, contracts: contractRows.map((contract) => serializeContract(contract, user, contract.templateId ? templateMap.get(contract.templateId) : undefined)), pdfEnabled: config.pdfEnabled && config.enabledModules.includes("pdf") });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const body = await request.json() as { name?: string; phone?: string; company?: string; nationalId?: string };
  if (!body.name?.trim() || !body.phone?.trim()) return NextResponse.json({ error: "نام و شماره موبایل الزامی است." }, { status: 400 });
  const existing = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!existing.length) return NextResponse.json({ error: "حساب کاربری پیدا نشد." }, { status: 404 });
  const [updated] = await db.update(users).set({ name: body.name.trim(), phone: body.phone.trim(), company: body.company?.trim() || null, nationalId: body.nationalId?.trim() || null }).where(eq(users.id, userId)).returning();
  await logAudit({ actor: updated.name, action: "account_updated", description: "جزئیات حساب مشتری از داشبورد کاربری به‌روزرسانی شد.", request, metadata: { userId } });
  return NextResponse.json({ user: serializeUser(updated) });
}
