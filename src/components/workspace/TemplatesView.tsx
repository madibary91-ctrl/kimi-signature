"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowDown, ArrowUp, Braces, Check, Eye, FilePlus2, FileText, LoaderCircle, Plus, Save, Search, Trash2, UsersRound, X } from "lucide-react";
import { StatusBadge } from "@/components/Brand";
import type { TemplateRecord } from "@/lib/domain";
import { formatDate, renderContract, sampleVariables, toFa, VARIABLE_DEFINITIONS } from "@/lib/domain";
import type { Notify } from "@/lib/workspace";

type Draft = { id?: string; title: string; description: string; category: string; content: string; signerRoles: string[]; status: string; version?: number };
const emptyDraft = (): Draft => ({ title: "", description: "", category: "خدمات", status: "active", signerRoles: ["مدیر پروژه", "کارفرما"], content: "قرارداد [PROJECT_TITLE]\nشماره سند: [CONTRACT_NUMBER] | تاریخ: [DATE]\n\nاین قرارداد میان مجری و [USER_NAME] از [COMPANY] منعقد می‌شود.\n\n۱. موضوع قرارداد\nشرح خدمات و خروجی‌های توافق‌شده را در این بخش بنویسید.\n\n۲. مبلغ و زمان‌بندی\nمبلغ [AMOUNT] و مهلت اجرا [DELIVERY_DAYS] از تاریخ [START_DATE] است.\n\n۳. حل اختلاف\nطرفین اختلافات را ابتدا از طریق مذاکره و داوری توافقی حل می‌کنند." });

export function TemplatesView({ templates, refresh, notify }: { templates: TemplateRecord[]; refresh: () => Promise<void>; notify: Notify }) {
  const [selectedId, setSelectedId] = useState<string | "new">(templates[0]?.id || "new");
  const [draft, setDraft] = useState<Draft>(templates[0] ? { ...templates[0], signerRoles: [...templates[0].signerRoles] } : emptyDraft());
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [busy, setBusy] = useState(false);
  const [roleInput, setRoleInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const selected = templates.find((item) => item.id === selectedId);
  const dirty = selectedId === "new" ? true : selected ? JSON.stringify({ ...selected, signerRoles: selected.signerRoles }) !== JSON.stringify(draft) : false;
  const filtered = useMemo(() => templates.filter((item) => `${item.title} ${item.category} ${item.description}`.toLowerCase().includes(query.toLowerCase())), [templates, query]);

  useEffect(() => {
    if (selectedId === "new") return;
    const template = templates.find((item) => item.id === selectedId);
    if (template && !busy) setDraft({ ...template, signerRoles: [...template.signerRoles] });
  }, [selectedId, templates, busy]);

  function choose(id: string | "new") { setSelectedId(id); setDraft(id === "new" ? emptyDraft() : { ...templates.find((item) => item.id === id)!, signerRoles: [...templates.find((item) => item.id === id)!.signerRoles] }); }
  function patch(values: Partial<Draft>) { setDraft((current) => ({ ...current, ...values })); }
  function insertVariable(key: string) {
    const textarea = textareaRef.current;
    const token = `[${key}]`;
    if (!textarea) return patch({ content: `${draft.content}${token}` });
    const start = textarea.selectionStart, end = textarea.selectionEnd;
    patch({ content: draft.content.slice(0, start) + token + draft.content.slice(end) });
    requestAnimationFrame(() => { textarea.focus(); textarea.setSelectionRange(start + token.length, start + token.length); });
  }
  function moveRole(index: number, direction: -1 | 1) {
    const target = index + direction; if (target < 0 || target >= draft.signerRoles.length) return;
    const roles = [...draft.signerRoles]; [roles[index], roles[target]] = [roles[target], roles[index]]; patch({ signerRoles: roles });
  }
  async function save() {
    if (!draft.title.trim() || !draft.content.trim() || !draft.signerRoles.length) return notify("عنوان، متن و حداقل یک نقش امضاکننده الزامی است.", "error");
    setBusy(true);
    try {
      const response = await fetch(draft.id ? `/api/templates/${draft.id}` : "/api/templates", { method: draft.id ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(draft) });
      const data = await response.json() as { template?: TemplateRecord; error?: string };
      if (!response.ok || !data.template) throw new Error(data.error || "ذخیره قالب ناموفق بود.");
      setSelectedId(data.template.id); setDraft({ ...data.template, signerRoles: [...data.template.signerRoles] });
      await refresh(); notify(draft.id ? `قالب به نسخه ${toFa(data.template.version)} ارتقا یافت.` : "قالب جدید با موفقیت ساخته شد.");
    } catch (cause) { notify(cause instanceof Error ? cause.message : "خطا در ذخیره قالب", "error"); }
    finally { setBusy(false); }
  }
  const preview = renderContract(draft.content, sampleVariables());
  return <div className="space-y-5"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><span className="badge bg-ink text-mint"><Braces size={12} />Template Engine</span><h1 className="mt-3 text-2xl font-black">قالب‌ها و متغیرهای پویا</h1><p className="mt-2 text-xs text-ink/45">هر ذخیره یک نسخه تازه می‌سازد؛ قراردادهای قبلی روی Snapshot خود باقی می‌مانند.</p></div><div className="flex gap-2"><button onClick={() => choose("new")} className="btn-secondary"><FilePlus2 size={16} />قالب جدید</button><button onClick={save} disabled={busy || (!dirty && selectedId !== "new")} className="btn-primary">{busy ? <LoaderCircle size={16} className="animate-spin" /> : <Save size={16} />}ذخیره قالب</button></div></div>
    <div className="grid items-start gap-5 xl:grid-cols-[285px_minmax(0,1fr)]">
      <aside className="panel-solid overflow-hidden xl:sticky xl:top-24"><div className="border-b border-ink/10 p-4"><div className="relative"><Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/30" /><input value={query} onChange={(e) => setQuery(e.target.value)} className="input !min-h-10 !pr-9 !text-[11px]" placeholder="جست‌وجوی قالب…" /></div></div><div className="thin-scroll max-h-[650px] overflow-y-auto p-2">{filtered.map((template) => <button key={template.id} onClick={() => choose(template.id)} className={`mb-1 w-full rounded-2xl p-4 text-right transition ${selectedId === template.id ? "bg-ink text-white" : "hover:bg-stone-50"}`}><div className="flex items-start justify-between gap-2"><FileText size={17} className={selectedId === template.id ? "text-mint" : "text-ink/35"} /><StatusBadge status={template.status} /></div><b className="mt-3 block text-[11px] leading-6">{template.title}</b><p className={`mt-1 line-clamp-2 text-[9px] leading-5 ${selectedId === template.id ? "text-white/40" : "text-ink/35"}`}>{template.description}</p><div className={`mt-3 flex items-center justify-between text-[8px] ${selectedId === template.id ? "text-white/35" : "text-ink/30"}`}><span>نسخه {toFa(template.version)}</span><span>{toFa(template.signerRoles.length)} امضاکننده</span></div></button>)}{!filtered.length && <p className="p-8 text-center text-[11px] text-ink/35">قالبی پیدا نشد.</p>}</div></aside>
      <section className="panel-solid min-w-0 overflow-hidden"><div className="flex items-center justify-between border-b border-ink/10 px-5 py-4"><div className="flex rounded-xl bg-stone-100 p-1"><button onClick={() => setMode("edit")} className={`rounded-lg px-4 py-2 text-[11px] font-bold ${mode === "edit" ? "bg-white shadow-sm" : "text-ink/40"}`}>ویرایش</button><button onClick={() => setMode("preview")} className={`rounded-lg px-4 py-2 text-[11px] font-bold ${mode === "preview" ? "bg-white shadow-sm" : "text-ink/40"}`}><Eye size={13} className="ml-1 inline" />پیش‌نمایش</button></div><span className="text-[9px] text-ink/30">{draft.id ? `آخرین ویرایش ${formatDate(selected?.updatedAt)}` : "پیش‌نویس تازه"}</span></div>
        <AnimatePresence mode="wait">{mode === "edit" ? <motion.div key="edit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid min-w-0 lg:grid-cols-[minmax(0,1fr)_255px]"><div className="min-w-0 p-5 sm:p-6"><div className="grid gap-4 sm:grid-cols-2"><div className="sm:col-span-2"><label className="label">عنوان قالب</label><input className="input" value={draft.title} onChange={(e) => patch({ title: e.target.value })} placeholder="مثلاً قرارداد خدمات سازمانی" /></div><div><label className="label">دسته‌بندی</label><select className="input" value={draft.category} onChange={(e) => patch({ category: e.target.value })}>{["خدمات", "فروشگاه", "حقوقی", "نمایندگی", "پشتیبانی", "سایر"].map((item) => <option key={item}>{item}</option>)}</select></div><div><label className="label">وضعیت انتشار</label><select className="input" value={draft.status} onChange={(e) => patch({ status: e.target.value })}><option value="active">فعال و قابل صدور</option><option value="draft">پیش‌نویس</option></select></div><div className="sm:col-span-2"><label className="label">توضیح کاربرد</label><input className="input" value={draft.description} onChange={(e) => patch({ description: e.target.value })} placeholder="این قالب برای چه فرایندی است؟" /></div></div><div className="mt-5"><label className="label">متن قرارداد و متغیرها</label><textarea ref={textareaRef} className="input min-h-[510px] !font-normal" value={draft.content} onChange={(e) => patch({ content: e.target.value })} dir="rtl" /></div></div>
          <aside className="border-t border-ink/10 bg-stone-50/60 p-5 lg:border-r lg:border-t-0"><div><h3 className="flex items-center gap-2 text-xs font-black"><Braces size={15} />درج متغیر</h3><p className="mt-2 text-[9px] leading-5 text-ink/35">برای قرار دادن در محل مکان‌نما کلیک کنید.</p><div className="mt-4 flex flex-wrap gap-2">{VARIABLE_DEFINITIONS.map((variable) => <button key={variable.key} onClick={() => insertVariable(variable.key)} className="rounded-lg border border-ink/10 bg-white px-2.5 py-2 text-[9px] font-semibold transition hover:border-emerald-400 hover:text-emerald-800" title={variable.key}>{variable.label}<span className="ltr mr-1 text-ink/25">+</span></button>)}</div></div><div className="divider my-6" /><div><h3 className="flex items-center gap-2 text-xs font-black"><UsersRound size={15} />ترتیب امضاکنندگان</h3><div className="mt-4 space-y-2">{draft.signerRoles.map((role, index) => <div key={`${role}-${index}`} className="flex items-center gap-2 rounded-xl border border-ink/10 bg-white p-2"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-ink text-[9px] text-mint">{toFa(index + 1)}</span><input className="min-w-0 flex-1 bg-transparent text-[10px] font-bold outline-none" value={role} onChange={(e) => { const roles = [...draft.signerRoles]; roles[index] = e.target.value; patch({ signerRoles: roles }); }} /><div className="flex"><button className="p-1 text-ink/30 hover:text-ink disabled:opacity-20" disabled={index === 0} onClick={() => moveRole(index, -1)} title="بالا"><ArrowUp size={12} /></button><button className="p-1 text-ink/30 hover:text-ink disabled:opacity-20" disabled={index === draft.signerRoles.length - 1} onClick={() => moveRole(index, 1)} title="پایین"><ArrowDown size={12} /></button><button className="p-1 text-rose-400 disabled:opacity-20" disabled={draft.signerRoles.length === 1} onClick={() => patch({ signerRoles: draft.signerRoles.filter((_, i) => i !== index) })} title="حذف"><X size={12} /></button></div></div>)}</div><div className="mt-2 flex gap-2"><input className="input !min-h-9 !px-3 !text-[10px]" placeholder="نقش تازه…" value={roleInput} onChange={(e) => setRoleInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && roleInput.trim()) { patch({ signerRoles: [...draft.signerRoles, roleInput.trim()] }); setRoleInput(""); } }} /><button className="btn-secondary !min-h-9 !px-3" onClick={() => { if (roleInput.trim()) { patch({ signerRoles: [...draft.signerRoles, roleInput.trim()] }); setRoleInput(""); } }}><Plus size={14} /></button></div></div><div className="mt-6 rounded-xl bg-emerald-50 p-3 text-[9px] leading-5 text-emerald-800"><Check size={13} className="ml-1 inline" />آخرین نقش به‌صورت پیش‌فرض مشتری است؛ در فرم صدور قابل تغییر است.</div></aside></motion.div> : <motion.div key="preview" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="bg-[#e9ebe5] p-4 sm:p-8"><article className="contract-paper mx-auto shadow-xl"><div className="border-b-2 border-ink pb-4 text-[10px] text-ink/45">پیش‌نمایش با داده نمونه • {draft.category}</div>{preview.split("\n").map((line, index) => { const text = line.trim(); if (!text) return <div key={index} className="h-2" />; if (index === 0) return <h1 className="doc-title" key={index}>{text}</h1>; if (/^[۰-۹0-9]+[.．]/.test(text)) return <h2 className="doc-clause" key={index}>{text}</h2>; return <p className="doc-paragraph" key={index}>{text}</p>; })}<div className="mt-10 grid grid-cols-2 gap-3">{draft.signerRoles.map((role, index) => <div key={index} className="rounded-xl border border-ink/10 p-4 text-center text-[10px] text-ink/45">محل امضای {toFa(index + 1)}<br /><b className="text-ink">{role}</b></div>)}</div></article></motion.div>}</AnimatePresence>
      </section>
    </div></div>;
}
