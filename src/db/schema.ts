import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import type { Signer, WorkspaceSettings } from "@/lib/domain";

export const users = pgTable("emzagar_users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone").notNull(),
  nationalId: text("national_id"),
  company: text("company"),
  role: text("role").notNull().default("customer"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const templates = pgTable("emzagar_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  content: text("content").notNull(),
  signerRoles: jsonb("signer_roles").$type<string[]>().notNull().default([]),
  status: text("status").notNull().default("active"),
  version: integer("version").notNull().default(1),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const contracts = pgTable("emzagar_contracts", {
  id: uuid("id").primaryKey().defaultRandom(),
  number: text("number").notNull().unique(),
  title: text("title").notNull(),
  templateId: uuid("template_id").references(() => templates.id),
  userId: uuid("user_id").references(() => users.id).notNull(),
  templateVersion: integer("template_version").notNull().default(1),
  content: text("content").notNull(),
  variables: jsonb("variables").$type<Record<string, string>>().notNull().default({}),
  signers: jsonb("signers").$type<Signer[]>().notNull().default([]),
  currentSigner: integer("current_signer").notNull().default(0),
  status: text("status").notNull().default("pending"),
  verificationHash: text("verification_hash"),
  source: text("source").notNull().default("manual"),
  issuedAt: timestamp("issued_at", { withTimezone: true }).notNull().defaultNow(),
  signedAt: timestamp("signed_at", { withTimezone: true }),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const otpChallenges = pgTable("emzagar_otp_challenges", {
  id: uuid("id").primaryKey().defaultRandom(),
  contractId: uuid("contract_id").references(() => contracts.id, { onDelete: "cascade" }).notNull(),
  signerId: text("signer_id").notNull(),
  phone: text("phone").notNull(),
  codeHash: text("code_hash").notNull(),
  developmentCode: text("development_code"),
  attempts: integer("attempts").notNull().default(0),
  maxAttempts: integer("max_attempts").notNull().default(5),
  verified: boolean("verified").notNull().default(false),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  lastSentAt: timestamp("last_sent_at", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const auditEvents = pgTable("emzagar_audit_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  contractId: uuid("contract_id").references(() => contracts.id, { onDelete: "cascade" }),
  actor: text("actor").notNull(),
  action: text("action").notNull(),
  description: text("description").notNull(),
  ip: text("ip"),
  userAgent: text("user_agent"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const settings = pgTable("emzagar_settings", {
  id: integer("id").primaryKey().default(1),
  data: jsonb("data").$type<WorkspaceSettings>().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
