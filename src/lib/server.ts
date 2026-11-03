import { createHash, randomBytes } from "node:crypto";
import { and, eq, lt } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { db } from "@/db";
import { auditEvents, contracts, settings, templates, users } from "@/db/schema";
import { DEFAULT_SETTINGS, type AuditRecord, type ContractRecord, type TemplateRecord, type UserRecord, type WorkspaceSettings } from "@/lib/domain";

export function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function randomToken(bytes = 24) {
  return randomBytes(bytes).toString("hex");
}

export function requestContext(request: Request | NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return {
    ip: forwarded || request.headers.get("x-real-ip") || "127.0.0.1",
    userAgent: request.headers.get("user-agent") || "Unknown",
  };
}

export async function getSettings(): Promise<WorkspaceSettings> {
  const rows = await db.select().from(settings).where(eq(settings.id, 1)).limit(1);
  if (!rows.length) {
    await db.insert(settings).values({ id: 1, data: DEFAULT_SETTINGS }).onConflictDoNothing();
    return DEFAULT_SETTINGS;
  }
  return { ...DEFAULT_SETTINGS, ...rows[0].data };
}

export function serializeUser(row: typeof users.$inferSelect): UserRecord {
  return { ...row, createdAt: row.createdAt.toISOString() };
}

export function serializeTemplate(row: typeof templates.$inferSelect): TemplateRecord {
  return {
    ...row,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function serializeContract(
  row: typeof contracts.$inferSelect,
  user?: UserRecord,
  templateTitle?: string,
): ContractRecord {
  return {
    ...row,
    issuedAt: row.issuedAt.toISOString(),
    signedAt: row.signedAt?.toISOString() || null,
    expiresAt: row.expiresAt?.toISOString() || null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    user,
    templateTitle,
  };
}

export function serializeAudit(row: typeof auditEvents.$inferSelect, contractNumber?: string): AuditRecord {
  return {
    ...row,
    createdAt: row.createdAt.toISOString(),
    contractNumber,
  };
}

export async function expireDueContracts() {
  const now = new Date();
  const expired = await db.update(contracts).set({ status: "expired", updatedAt: now }).where(and(eq(contracts.status, "pending"), lt(contracts.expiresAt, now))).returning({ id: contracts.id, number: contracts.number });
  if (expired.length) {
    await db.insert(auditEvents).values(expired.map((contract) => ({ contractId: contract.id, actor: "زمان‌بند", action: "expired", description: `مهلت امضای قرارداد ${contract.number} به پایان رسید و لینک آن بسته شد.`, metadata: { automatic: true }, createdAt: now })));
  }
}

export async function getContractRecord(id: string): Promise<ContractRecord | null> {
  await expireDueContracts();
  const rows = await db.select().from(contracts).where(eq(contracts.id, id)).limit(1);
  if (!rows.length) return null;
  const row = rows[0];
  const [userRows, templateRows] = await Promise.all([
    db.select().from(users).where(eq(users.id, row.userId)).limit(1),
    row.templateId ? db.select().from(templates).where(eq(templates.id, row.templateId)).limit(1) : Promise.resolve([]),
  ]);
  return serializeContract(row, userRows[0] ? serializeUser(userRows[0]) : undefined, templateRows[0]?.title);
}

export async function logAudit(input: {
  contractId?: string | null;
  actor: string;
  action: string;
  description: string;
  request?: Request | NextRequest;
  metadata?: Record<string, unknown>;
}) {
  const context = input.request ? requestContext(input.request) : { ip: null, userAgent: null };
  await db.insert(auditEvents).values({
    contractId: input.contractId,
    actor: input.actor,
    action: input.action,
    description: input.description,
    metadata: input.metadata || {},
    ...context,
  });
}
