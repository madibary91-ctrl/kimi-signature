"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowDown, ArrowLeft, ArrowUp, Braces, Check, CheckCircle2, Copy, ExternalLink, FilePlus2, LoaderCircle, RotateCcw, UserRound, UsersRound } from "lucide-react";
import type { ContractRecord, TemplateRecord, UserRecord, WorkspaceSettings } from "@/lib/domain";
import { formatDate, renderContract, sampleVariables, toFa, VARIABLE_DEFINITIONS } from "@/lib/domain";
import type { Notify } from "@/lib/workspace";

type EditableSigner = { name: string; role: string; phone: string; email: string };
const automatic = new Set(["USER_NAME", "COMPANY", "NATIONAL_ID", "USER_EMAIL", "CONTRACT_NUMBER", "DATE"]);

export function IssueView({ templates, users, settings, refresh, notify }: { templates: TemplateRecord[]; users: UserRecord[]; settings: WorkspaceSettings; refresh: () => Promise<void>; notify: Notify }) {
  const activeTemplates = templates.filter((item) => item.status === "active");
  const [templateId, setTemplateId] = useState(activeTemplates[0]?.id || "");
  const [userId, setUserId] = useState(users.find((user) => user.role === "customer")?.id || users[0]?.id || "");
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [signers, setSigners] = useState<EditableSigner[]>([]);
  const [expiryDays, setExpiryDays] = useState(settings.expiryDays);
  const [busy, setBusy] = useState(false);
  const [issued, setIssued] = useState<ContractRecord | null>(null);
  const template = templates.find((item) => item.id === templateId);
  const user = users.find((item) => item.id === userId);
  const variableKeys = useMemo(() => template ? Array.from(new Set(Array.from(template.content.matchAll(/\[([A-Z0-9_]+)\]/g)).map((match) => match[1]))).filter((key) => !automatic.has(key)) : [], [template]);
  const missing = variableKeys.filter((key) => !variables[key]?.trim());

  useEffect(() => {
    if (!template || !user) return;
    const internal = users.find((item) => item.role !== "customer") || user;
    setSigners(template.signerRoles.map((role, index) => {
      const person = index === template.signerRoles.length - 1 ? user : internal;
      return { role, name: person.name, phone: person.phone, email: person.email };
    }));
    const next: Record<string, string> = {};
    variableKeys.forEach((key) => {
      if (key === "PROJECT_TITLE") next[key] = template.title.replace(/^قرارداد |^توافق‌نامه |^تعهدنامه /, "");
      else if (key === "START_DATE") next[key] = formatDate(new Date());
      else if (key === "ORDER_ID") next[key] = "—";
      else next[key] = "";
    });
    setVariables(next);
    setIssued(null);
    // Reset only when the selected parties or template change, not on each keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateId, userId]);

  function patchSigner(index: number, values: Partial<EditableSigner>) { setSigners((current) => current.map((item, i) => i === index ? { ...item, ...values } : item)); }
  function moveSigner(index: number, direction: -1 | 1) { const target = index + direction; if (target < 0 || target >= signers.length) return; setSigners((current) => { const next = [...current]; [next[index], next[target]] = [next[target], next[index]]; return next; }); }
  const previewVariables = { ...sampleVariables(), USER_NAME: user?.name || "—", COMPANY: user?.company || "—", USER_EMAIL: user?.email || "—", NATIONAL_ID: user?.nationalId || "—", ...Object.fromEntries(Object.entries(variables).map(([key, value]) => [key, value || sampleVariables()[key] || `[${key}]`])) };
  const preview = template ? renderContract(template.content, previewVariables) : "";

  async function issueContract() {
    if (!template || !user || missing.length || signers.some((item) => !item.name.trim() || !item.phone.trim())) return;
    setBusy(true);
    try {
      const response = await fetch("/api/contracts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ templateId, userId, variables, signers, expiryDays }) });
      const data = await response.json() as { contract?: ContractRecord; error?: string };
      if (!response.ok || !data.contract) throw new Error(data.error || "صدور قرارداد ناموفق بود.");
      setIssued(data.contract); await refresh(); notify(`قرارداد ${data.contract.number} صادر و نخستین امضاکننده فعال شد.`);
    } catch (cause) { notify(cause instanceof Error ? cause.message : "خطا در صدور", "error"); }
    finally { setBusy(false); }
  }
  async function copyLink() { if (!issued) return; await navigator.clipboard.writeText(`${window.location.origin}/sign/${issued.id}`); notify("لینک صفحه امضا کپی شد."); }
  if (!activeTemplates.length || !users.length) return <div className="panel-solid p-16 text-center"><FilePlus2 className="mx-auto text-ink/20" /><h2 className="mt-4 font-black">برای صدور، قالب فعال و کاربر لازم است</h2><p className="mt-2 text-xs text-ink/40">ابتدا یک قالب را از حالت پیش‌نویس خارج کنید.</p></div>;
  return <div className="space-y-5"><div><span className="badge bg-ink text-mint"><FilePlus2 size={12} />Issue Command</span><h1 className="mt-3 text-2xl font-black">صدور قرارداد جدید</h1><p className="mt-2 text-xs text-ink/45">قالب، داده‌ها و ترتیب امضا را نهایی کنید؛ یک Snapshot مستقل و لینک واقعی ساخته می‌شود.</p></div>
    <AnimatePresence>{issued && <motion.div initial={{ opacity: 0, y: -20, height: 0 }} animate={{ opacity: 1, y: 0, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden rounded-3xl border border-emerald-200 bg-emerald-50 p-5"><div className="flex flex-col gap-4 md:flex-row md:items-center"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-emerald-600 text-white"><CheckCircle2 size={23} /></span><div className="flex-1"><b className="text-sm text-emerald-950">قرارداد {issued.number} با موفقیت صادر شد</b><p className="mt-1 text-[10px] text-emerald-800/60">نوبت نخست برای {issued.signers[0]?.name} فعال است. لینک زیر همان سند واقعی را باز می‌کند.</p></div><div className="flex flex-wrap gap-2"><button onClick={copyLink} className="btn-secondary"><Copy size={15} />کپی لینک</button><Link href={`/sign/${issued.id}`} target="_blank" className="btn-primary">مشاهده و امضا<ExternalLink size={15} /></Link></div></div></motion.div>}</AnimatePresence>
    <div className="grid items-start gap-5 xl:grid-cols-[460px_minmax(0,1fr)]">
      <div className="space-y-5">
        <section className="panel-solid p-5 sm:p-6"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-ink text-mint"><FilePlus2 size={17} /></span><div><h2 className="text-sm font-black">۱. مبدأ و طرف قرارداد</h2><p className="text-[9px] text-ink/35">قالب فعال و کاربر ووکامرس</p></div></div><div className="mt-5 grid gap-4 sm:grid-cols-2"><div><label className="label">قالب قرارداد</label><select className="input" value={templateId} onChange={(e) => setTemplateId(e.target.value)}>{activeTemplates.map((item) => <option value={item.id} key={item.id}>{item.title}</option>)}</select></div><div><label className="label">کاربر / مشتری</label><select className="input" value={userId} onChange={(e) => setUserId(e.target.value)}>{users.map((item) => <option value={item.id} key={item.id}>{item.name} — {item.company || "شخصی"}</option>)}</select></div><div><label className="label">مهلت امضا (روز)</label><input className="input" type="number" min="1" max="90" value={expiryDays} onChange={(e) => setExpiryDays(Number(e.target.value))} /></div><div className="rounded-xl bg-stone-50 p-3"><span className="text-[9px] text-ink/35">نسخه ثابت سند</span><b className="mt-1 block text-xs">نسخه {toFa(template?.version || 1)} • {template?.category}</b></div></div></section>
        <section className="panel-solid p-5 sm:p-6"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-ink text-mint"><Braces size={17} /></span><div><h2 className="text-sm font-black">۲. داده‌های متغیر</h2><p className="text-[9px] text-ink/35">از خود متن قالب استخراج شده‌اند</p></div></div>{variableKeys.length ? <div className="mt-5 grid gap-4 sm:grid-cols-2">{variableKeys.map((key) => { const definition = VARIABLE_DEFINITIONS.find((item) => item.key === key); return <div key={key} className={key === "PROJECT_TITLE" ? "sm:col-span-2" : ""}><label className="label">{definition?.label || key}<span className="ltr mr-2 font-mono text-[8px] text-ink/25">[{key}]</span></label><input className={`input ${!variables[key]?.trim() ? "!border-amber-300" : ""}`} value={variables[key] || ""} onChange={(e) => setVariables((current) => ({ ...current, [key]: e.target.value }))} placeholder={definition?.sample || "مقدار متغیر"} /></div>; })}</div> : <p className="mt-5 rounded-xl bg-stone-50 p-4 text-[10px] text-ink/40">این قالب فقط از متغیرهای خودکار کاربر و قرارداد استفاده می‌کند.</p>}{missing.length > 0 && <p className="mt-4 text-[10px] text-amber-700">{toFa(missing.length)} متغیر هنوز مقدار ندارد؛ تا تکمیل آنها صدور ممکن نیست.</p>}</section>
        <section className="panel-solid p-5 sm:p-6"><div className="flex items-center justify-between"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-ink text-mint"><UsersRound size={17} /></span><div><h2 className="text-sm font-black">۳. صف امضاکنندگان</h2><p className="text-[9px] text-ink/35">به ترتیب از بالا به پایین</p></div></div><span className="badge bg-stone-100 text-ink/40">{toFa(signers.length)} مرحله</span></div><div className="mt-5 space-y-3">{signers.map((signer, index) => <div key={index} className="rounded-2xl border border-ink/10 bg-stone-50/60 p-4"><div className="flex items-center gap-2"><span className="grid h-7 w-7 place-items-center rounded-lg bg-ink text-[10px] text-mint">{toFa(index + 1)}</span><input className="input !min-h-8 !border-0 !bg-transparent !px-1 !text-[11px] !font-bold" value={signer.role} onChange={(e) => patchSigner(index, { role: e.target.value })} /><button disabled={index === 0} onClick={() => moveSigner(index, -1)} className="p-1 text-ink/35 disabled:opacity-20"><ArrowUp size={13} /></button><button disabled={index === signers.length - 1} onClick={() => moveSigner(index, 1)} className="p-1 text-ink/35 disabled:opacity-20"><ArrowDown size={13} /></button></div><div className="mt-3 grid gap-2 sm:grid-cols-2"><input className="input !min-h-9 !bg-white !text-[10px]" value={signer.name} onChange={(e) => patchSigner(index, { name: e.target.value })} aria-label="نام امضاکننده" /><input className="input ltr !min-h-9 !bg-white !text-left !text-[10px]" value={signer.phone} onChange={(e) => patchSigner(index, { phone: e.target.value })} aria-label="موبایل امضاکننده" /><input className="input ltr !min-h-9 !bg-white !text-left !text-[10px] sm:col-span-2" value={signer.email} onChange={(e) => patchSigner(index, { email: e.target.value })} aria-label="ایمیل امضاکننده" /></div></div>)}</div><button onClick={issueContract} disabled={busy || missing.length > 0 || signers.some((item) => !item.name.trim() || !item.phone.trim())} className="btn-primary mt-5 w-full !min-h-[52px]">{busy ? <LoaderCircle size={18} className="animate-spin" /> : <Check size={18} />}{busy ? "در حال ساخت Snapshot…" : "صدور و فعال‌سازی نخستین امضا"}</button>{issued && <button onClick={() => setIssued(null)} className="btn-ghost mt-2 w-full !text-[11px]"><RotateCcw size={14} />صدور قرارداد دیگر با همین داده</button>}</section>
      </div>
      <section className="panel-solid min-w-0 overflow-hidden xl:sticky xl:top-24"><div className="flex items-center justify-between border-b border-ink/10 px-5 py-4"><span className="text-xs font-black">پیش‌نمایش زنده سند</span><span className="badge bg-stone-100 text-ink/40">Snapshot پیش از صدور</span></div><div className="thin-scroll max-h-[1150px] overflow-auto bg-[#e7e9e3] p-3 sm:p-6"><article className="contract-paper mx-auto !text-[11px] shadow-lg"><div className="flex items-center justify-between border-b-2 border-ink pb-4"><b>امضاگیر</b><span className="text-[9px] text-ink/40">{user?.name}</span></div>{preview.split("\n").map((line, index) => { const text = line.trim(); if (!text) return <div key={index} className="h-2" />; if (index === 0) return <h1 className="doc-title" key={index}>{text}</h1>; if (/^[۰-۹0-9]+[.．]/.test(text)) return <h2 className="doc-clause" key={index}>{text}</h2>; return <p className="doc-paragraph" key={index}>{text}</p>; })}<div className="mt-8 grid grid-cols-2 gap-3">{signers.map((signer, index) => <div key={index} className="rounded-xl border border-ink/10 p-4 text-center"><UserRound size={16} className="mx-auto text-ink/25" /><b className="mt-2 block text-[10px]">{signer.name}</b><span className="text-[9px] text-ink/35">{signer.role}</span></div>)}</div></article></div></section>
    </div></div>;
}
