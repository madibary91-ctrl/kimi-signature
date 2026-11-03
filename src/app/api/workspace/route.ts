import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { auditEvents, contracts, templates, users } from "@/db/schema";
import { ensureSeed } from "@/db/seed";
import { expireDueContracts, getSettings, serializeAudit, serializeContract, serializeTemplate, serializeUser } from "@/lib/server";
import { PLUGIN_MODULES } from "@/lib/modules";

export const dynamic = "force-dynamic";

export async function GET() {
  await ensureSeed();
  await expireDueContracts();
  const [contractRows, templateRows, userRows, auditRows, workspaceSettings] = await Promise.all([
    db.select().from(contracts).orderBy(desc(contracts.createdAt)),
    db.select().from(templates).orderBy(desc(templates.updatedAt)),
    db.select().from(users).orderBy(users.name),
    db.select().from(auditEvents).orderBy(desc(auditEvents.createdAt)).limit(100),
    getSettings(),
  ]);
  const serializedUsers = userRows.map(serializeUser);
  const userMap = new Map(serializedUsers.map((user) => [user.id, user]));
  const templateMap = new Map(templateRows.map((template) => [template.id, template.title]));
  const contractNumberMap = new Map(contractRows.map((contract) => [contract.id, contract.number]));
  return NextResponse.json({
    contracts: contractRows.map((row) => serializeContract(row, userMap.get(row.userId), row.templateId ? templateMap.get(row.templateId) : undefined)),
    templates: templateRows.map(serializeTemplate),
    users: serializedUsers,
    audit: auditRows.map((row) => serializeAudit(row, row.contractId ? contractNumberMap.get(row.contractId) : undefined)),
    settings: workspaceSettings,
    modules: PLUGIN_MODULES,
    integrations: {
      kavenegarConfigured: Boolean(process.env.KAVENEGAR_API_KEY),
      woocommerceConfigured: Boolean(process.env.WOOCOMMERCE_WEBHOOK_SECRET),
      resendConfigured: Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM && process.env.ADMIN_EMAIL),
      appUrl: process.env.NEXT_PUBLIC_APP_URL || "",
    },
  });
}
