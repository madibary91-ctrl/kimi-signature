import { NextResponse } from "next/server";
import { db } from "@/db";
import { templates } from "@/db/schema";
import { ensureSeed } from "@/db/seed";
import { getSettings, logAudit, serializeTemplate } from "@/lib/server";

export async function POST(request: Request) {
  await ensureSeed();
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
  if (!body.title?.trim() || !body.content?.trim()) {
    return NextResponse.json({ error: "عنوان و متن قالب الزامی است." }, { status: 400 });
  }
  const roles = Array.isArray(body.signerRoles) ? body.signerRoles.map((role) => role.trim()).filter(Boolean) : [];
  if (!roles.length) return NextResponse.json({ error: "حداقل یک نقش امضاکننده تعریف کنید." }, { status: 400 });
  const [created] = await db.insert(templates).values({
    title: body.title.trim(),
    slug: `template-${Date.now()}`,
    description: body.description?.trim() || "قالب سفارشی قرارداد",
    category: body.category?.trim() || "سایر",
    content: body.content,
    signerRoles: roles,
    status: body.status === "draft" ? "draft" : "active",
  }).returning();
  await logAudit({ actor: "مدیر امضاگیر", action: "template_created", description: `قالب «${created.title}» ایجاد شد.`, request, metadata: { templateId: created.id } });
  return NextResponse.json({ template: serializeTemplate(created) }, { status: 201 });
}
