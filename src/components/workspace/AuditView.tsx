"use client";

import { useMemo, useState } from "react";
import { Download, FileClock, Search, ShieldCheck } from "lucide-react";
import type { AuditRecord } from "@/lib/domain";
import { formatDate, toFa } from "@/lib/domain";
import type { Notify } from "@/lib/workspace";

const actionLabels: Record<string, string> = { issued: "صدور", signed: "امضا", completed: "تکمیل", otp_sent: "ارسال OTP", identity_verified: "تأیید هویت", notification: "اطلاع‌رسانی", expired: "انقضا", cancelled: "لغو", deleted: "حذف", settings: "تنظیمات", template_created: "ساخت قالب", template_updated: "ویرایش قالب", pdf: "PDF", signer_advanced: "انتقال نوبت" };

export function AuditView({ events, notify }: { events: AuditRecord[]; notify: Notify }) {
  const [query, setQuery] = useState("");
  const [action, setAction] = useState("all");
  const filtered = useMemo(() => events.filter((event) => (action === "all" || event.action === action) && `${event.description} ${event.actor} ${event.contractNumber || ""}`.toLowerCase().includes(query.toLowerCase())), [events, query, action]);
  function exportCsv() {
    const escape = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;
    const rows = [["زمان", "عملیات", "عامل", "شرح", "قرارداد", "IP", "User-Agent"], ...filtered.map((event) => [event.createdAt, actionLabels[event.action] || event.action, event.actor, event.description, event.contractNumber || "", event.ip || "", event.userAgent || ""])];
    const blob = new Blob(["\ufeff" + rows.map((row) => row.map(escape).join(",")).join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = `emzagar-audit-${new Date().toISOString().slice(0, 10)}.csv`; anchor.click(); URL.revokeObjectURL(url);
    notify(`${toFa(filtered.length)} رویداد در فایل CSV ذخیره شد.`);
  }
  return <div className="space-y-6"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><span className="badge bg-ink text-mint"><ShieldCheck size={12} />Audit Trail</span><h1 className="mt-3 text-2xl font-black">دفتر رویدادهای امن</h1><p className="mt-2 text-xs text-ink/45">هر صدور، احراز هویت، امضا و تغییر پیکربندی با عامل و متادیتا ثبت می‌شود.</p></div><button onClick={exportCsv} className="btn-secondary"><Download size={16} />خروجی CSV</button></div>
    <div className="grid gap-3 sm:grid-cols-3"><div className="panel-solid p-5"><span className="text-[10px] text-ink/40">رویدادهای ثبت‌شده</span><b className="mt-2 block text-2xl font-black">{toFa(events.length)}</b></div><div className="panel-solid p-5"><span className="text-[10px] text-ink/40">امضا و تأیید هویت</span><b className="mt-2 block text-2xl font-black">{toFa(events.filter((e) => ["signed", "identity_verified"].includes(e.action)).length)}</b></div><div className="panel-solid p-5"><span className="text-[10px] text-ink/40">آخرین رویداد</span><b className="mt-3 block text-xs font-bold">{formatDate(events[0]?.createdAt, true)}</b></div></div>
    <div className="panel-solid overflow-hidden"><div className="flex flex-col gap-3 border-b border-ink/10 p-5 md:flex-row"><div className="relative flex-1"><Search size={15} className="absolute right-4 top-1/2 -translate-y-1/2 text-ink/30" /><input className="input !pr-11" placeholder="جست‌وجو در شرح، عامل یا شماره قرارداد…" value={query} onChange={(e) => setQuery(e.target.value)} /></div><select className="input md:w-52" value={action} onChange={(e) => setAction(e.target.value)}><option value="all">همه عملیات‌ها</option>{Array.from(new Set(events.map((event) => event.action))).map((item) => <option key={item} value={item}>{actionLabels[item] || item}</option>)}</select></div>
      <div className="divide-y divide-ink/[.07]">{filtered.map((event) => <div key={event.id} className="grid gap-3 px-5 py-5 transition hover:bg-stone-50/60 lg:grid-cols-[42px_140px_1fr_160px] lg:items-start"><span className="grid h-10 w-10 place-items-center rounded-xl bg-stone-100 text-ink/45"><FileClock size={17} /></span><div><span className="badge bg-stone-100 text-stone-600">{actionLabels[event.action] || event.action}</span><p className="mt-2 text-[9px] text-ink/35">{event.actor}</p></div><div><p className="text-[11px] leading-6 text-ink/70">{event.description}</p><div className="mt-2 flex flex-wrap gap-3 text-[9px] text-ink/30">{event.contractNumber && <span className="ltr">{event.contractNumber}</span>}{event.ip && <span className="ltr">IP {event.ip}</span>}{Object.keys(event.metadata || {}).length > 0 && <span>{toFa(Object.keys(event.metadata).length)} متادیتا</span>}</div>{event.userAgent && <p className="ltr mt-2 max-w-lg truncate text-left text-[8px] text-ink/25">{event.userAgent}</p>}</div><time className="text-[10px] text-ink/40 lg:text-left">{formatDate(event.createdAt, true)}</time></div>)}{!filtered.length && <div className="p-16 text-center text-xs text-ink/40">رویدادی با این فیلتر پیدا نشد.</div>}</div>
    </div></div>;
}
