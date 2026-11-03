import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { settings } from "@/db/schema";
import { DEFAULT_SETTINGS, type WorkspaceSettings } from "@/lib/domain";
import { getSettings, logAudit } from "@/lib/server";

const clamp = (value: unknown, min: number, max: number, fallback: number) => {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(max, Math.max(min, Math.round(number))) : fallback;
};

export async function PATCH(request: Request) {
  const current = await getSettings();
  const body = await request.json() as Partial<WorkspaceSettings>;
  const next: WorkspaceSettings = {
    ...current,
    otpRequired: typeof body.otpRequired === "boolean" ? body.otpRequired : current.otpRequired,
    pdfEnabled: typeof body.pdfEnabled === "boolean" ? body.pdfEnabled : current.pdfEnabled,
    woocommerceEnabled: typeof body.woocommerceEnabled === "boolean" ? body.woocommerceEnabled : current.woocommerceEnabled,
    otpExpirySeconds: clamp(body.otpExpirySeconds, 60, 600, current.otpExpirySeconds),
    resendSeconds: clamp(body.resendSeconds, 30, 600, current.resendSeconds),
    maxAttempts: clamp(body.maxAttempts, 3, 10, current.maxAttempts),
    expiryDays: clamp(body.expiryDays, 1, 90, current.expiryDays),
    smsProvider: body.smsProvider === "kavenegar" ? "kavenegar" : "demo",
    contractPrefix: typeof body.contractPrefix === "string" ? body.contractPrefix.replace(/[^A-Za-z0-9-]/g, "").slice(0, 10) || DEFAULT_SETTINGS.contractPrefix : current.contractPrefix,
    enabledModules: Array.isArray(body.enabledModules) ? Array.from(new Set(["core", "audit", ...body.enabledModules.filter((item): item is string => typeof item === "string")])) : current.enabledModules,
    productMappings: Array.isArray(body.productMappings) ? body.productMappings.filter((item) => item && typeof item.productId === "string" && typeof item.templateId === "string").slice(0, 30) : current.productMappings,
  };
  const [updated] = await db.update(settings).set({ data: next, updatedAt: new Date() }).where(eq(settings.id, 1)).returning();
  await logAudit({ actor: "مدیر سیستم", action: "settings", description: "پیکربندی ماژول‌ها و سیاست‌های امنیتی به‌روزرسانی شد.", request, metadata: { enabledModules: next.enabledModules, smsProvider: next.smsProvider } });
  return NextResponse.json({ settings: updated.data });
}
