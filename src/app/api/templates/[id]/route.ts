import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { templates } from "@/db/schema";
import { getSettings, logAudit, serializeTemplate } from "@/lib/server";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const config = await getSettings();
  if (!config.enabledModules.includes("templates")) return NextResponse.json({ error: "ماژول قالب‌ها غیرفعال است." }, { status: 503 });
  const body = await request.json() as {
    title?: string;
    description?: string;
    category?: string;
    content?: string;
    signerRoles?: string[];
    status?: string;
  };
  const existing = await db.select().from(templates).where(eq(templates.id, id)).limit(1);
  if (!existing.length) return NextResponse.json({ error: "قالب پیدا نشد." }, { status: 404 });
  if (!body.title?.trim() || !body.content?.trim()) return NextResponse.json({ error: "عنوان و متن قالب الزامی است." }, { status: 400 });
  const roles = Array.isArray(body.signerRoles) ? body.signerRoles.map((role) => role.trim()).filter(Boolean) : [];
  if (!roles.length) return NextResponse.json({ error: "حداقل یک نقش امضاکننده لازم است." }, { status: 400 });
  const [updated] = await db.update(templates).set({
    title: body.title.trim(),
    description: body.description?.trim() || existing[0].description,
    category: body.category?.trim() || existing[0].category,
    content: body.content,
    signerRoles: roles,
    status: body.status === "draft" ? "draft" : "active",
    version: existing[0].version + 1,
    updatedAt: new Date(),
  }).where(eq(templates.id, id)).returning();
  await logAudit({ actor: "مدیر امضاگیر", action: "template_updated", description: `قالب «${updated.title}» به نسخه ${updated.version} ارتقا یافت.`, request, metadata: { templateId: id, version: updated.version } });
  return NextResponse.json({ template: serializeTemplate(updated) });
}
