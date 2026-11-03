export type ContractStatus = "pending" | "signed" | "expired" | "cancelled";
export type SignatureMethod = "draw" | "upload";

export type Signer = {
  id: string;
  name: string;
  role: string;
  phone: string;
  email: string;
  order: number;
  status: "waiting" | "active" | "signed";
  signedAt?: string;
  signatureData?: string;
  signatureMethod?: SignatureMethod;
  ip?: string;
  userAgent?: string;
};

export type TemplateRecord = {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  content: string;
  signerRoles: string[];
  status: "active" | "draft" | string;
  version: number;
  createdAt: string;
  updatedAt: string;
};

export type UserRecord = {
  id: string;
  name: string;
  email: string;
  phone: string;
  nationalId?: string | null;
  company?: string | null;
  role: string;
  createdAt: string;
};

export type ContractRecord = {
  id: string;
  number: string;
  title: string;
  templateId?: string | null;
  userId: string;
  templateVersion: number;
  content: string;
  variables: Record<string, string>;
  signers: Signer[];
  currentSigner: number;
  status: ContractStatus | string;
  verificationHash?: string | null;
  source: string;
  issuedAt: string;
  signedAt?: string | null;
  expiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
  templateTitle?: string;
  user?: UserRecord;
};

export type AuditRecord = {
  id: string;
  contractId?: string | null;
  actor: string;
  action: string;
  description: string;
  ip?: string | null;
  userAgent?: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  contractNumber?: string;
};

export type WorkspaceSettings = {
  otpRequired: boolean;
  otpExpirySeconds: number;
  resendSeconds: number;
  maxAttempts: number;
  smsProvider: "demo" | "kavenegar";
  pdfEnabled: boolean;
  contractPrefix: string;
  expiryDays: number;
  woocommerceEnabled: boolean;
  enabledModules: string[];
  productMappings: { productId: string; templateId: string }[];
};

export const DEFAULT_SETTINGS: WorkspaceSettings = {
  otpRequired: true,
  otpExpirySeconds: 120,
  resendSeconds: 120,
  maxAttempts: 5,
  smsProvider: "demo",
  pdfEnabled: true,
  contractPrefix: "EMZ",
  expiryDays: 7,
  woocommerceEnabled: false,
  enabledModules: ["core", "templates", "workflow", "identity", "signature", "pdf", "notifications", "audit", "woocommerce"],
  productMappings: [],
};

export const VARIABLE_DEFINITIONS = [
  { key: "USER_NAME", label: "نام کاربر", sample: "نگار محمدی" },
  { key: "COMPANY", label: "نام شرکت", sample: "استودیو روشن" },
  { key: "NATIONAL_ID", label: "شناسه ملی", sample: "۰۰۴۵۸۷۹۳۲۱" },
  { key: "USER_EMAIL", label: "ایمیل کاربر", sample: "user@example.com" },
  { key: "CONTRACT_NUMBER", label: "شماره قرارداد", sample: "EMZ-۱۴۰۵-۱۰۲۴" },
  { key: "DATE", label: "تاریخ امروز", sample: "۲۵ تیر ۱۴۰۵" },
  { key: "START_DATE", label: "تاریخ شروع", sample: "۱ مرداد ۱۴۰۵" },
  { key: "AMOUNT", label: "مبلغ قرارداد", sample: "۱۲۰٬۰۰۰٬۰۰۰ ریال" },
  { key: "PROJECT_TITLE", label: "عنوان پروژه", sample: "بازطراحی فروشگاه اینترنتی" },
  { key: "DELIVERY_DAYS", label: "مهلت تحویل", sample: "۳۰ روز کاری" },
  { key: "ORDER_ID", label: "شماره سفارش", sample: "WC-۸۴۲۱" },
] as const;

export function renderContract(content: string, variables: Record<string, string>) {
  return content.replace(/\[([A-Z0-9_]+)\]/g, (match, key: string) => variables[key] || match);
}

export function sampleVariables(): Record<string, string> {
  return Object.fromEntries(VARIABLE_DEFINITIONS.map((item) => [item.key, item.sample]));
}

export function formatDate(value?: string | Date | null, withTime = false) {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("fa-IR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  }).format(date);
}

export function toFa(value: string | number) {
  return String(value).replace(/\d/g, (digit) => "۰۱۲۳۴۵۶۷۸۹"[Number(digit)]);
}

export const STATUS_LABELS: Record<string, string> = {
  pending: "در انتظار امضا",
  signed: "امضا شده",
  expired: "منقضی شده",
  cancelled: "لغو شده",
};
