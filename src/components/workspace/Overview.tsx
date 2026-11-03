"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowLeft, ArrowUpLeft, CheckCircle2, Clock3, FilePlus2, Files, FileText, PenLine, ScrollText, ShieldCheck, Users } from "lucide-react";
import { StatusBadge } from "@/components/Brand";
import type { WorkspaceData, WorkspaceView } from "@/lib/workspace";
import { formatDate, toFa } from "@/lib/domain";

export function Overview({ data, navigate }: { data: WorkspaceData; navigate: (view: WorkspaceView) => void }) {
  const signed = data.contracts.filter((item) => item.status === "signed").length;
  const pending = data.contracts.filter((item) => item.status === "pending").length;
  const expired = data.contracts.filter((item) => item.status === "expired").length;
  const total = data.contracts.length;
  const completion = total ? Math.round(signed / total * 100) : 0;
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(); date.setHours(0, 0, 0, 0); date.setDate(date.getDate() - (6 - index));
    const next = new Date(date); next.setDate(next.getDate() + 1);
    return { label: new Intl.DateTimeFormat("fa-IR", { weekday: "short" }).format(date), count: data.contracts.filter((contract) => { const time = new Date(contract.issuedAt).getTime(); return time >= date.getTime() && time < next.getTime(); }).length };
  });
  const maxCount = Math.max(1, ...days.map((day) => day.count));
  const stats = [
    { label: "کل قراردادها", value: total, icon: Files, note: `${toFa(data.templates.length)} قالب فعال در سامانه`, color: "bg-[#e5eee8]" },
    { label: "در انتظار امضا", value: pending, icon: Clock3, note: "نیازمند پیگیری امضاکننده", color: "bg-amber-100" },
    { label: "امضای قطعی", value: signed, icon: CheckCircle2, note: `${toFa(completion)}٪ نرخ تکمیل کل`, color: "bg-emerald-100" },
    { label: "رویداد حسابرسی", value: data.audit.length, icon: ShieldCheck, note: "ردپای زمان، عامل و درخواست", color: "bg-[#e8e4f5]" },
  ];
  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[28px] bg-ink px-7 py-8 text-white sm:px-9 sm:py-10">
        <div className="hero-grid absolute inset-0 opacity-50" /><div className="absolute -left-16 -top-24 h-72 w-72 rounded-full bg-mint/10 blur-[70px]" />
        <div className="relative flex flex-col justify-between gap-7 md:flex-row md:items-center"><div><span className="badge border border-white/10 bg-white/5 text-mint">میزکار عملیاتی امضاگیر</span><h1 className="mt-4 text-2xl font-black sm:text-3xl">قراردادها گم نمی‌شوند؛<br className="sm:hidden" /> مسیرشان مشخص است.</h1><p className="mt-3 max-w-xl text-xs leading-7 text-white/45">{pending ? `${toFa(pending)} قرارداد در صف امضا دارید. ` : "صف امضا خالی است. "}از قالب آماده شروع کنید یا یک قالب تازه با متغیر و ترتیب امضا بسازید.</p></div><button onClick={() => navigate("issue")} className="btn-primary btn-mint shrink-0 !min-h-[50px]"><FilePlus2 size={18} />صدور قرارداد جدید</button></div>
      </section>
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat, index) => <motion.div key={stat.label} initial={{ opacity: 0, y: 25 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * .06 }} className="panel-solid p-5"><div className="flex items-start justify-between"><span className={`grid h-11 w-11 place-items-center rounded-2xl ${stat.color}`}><stat.icon size={20} /></span><span className="text-[10px] text-ink/30">۰{toFa(index + 1)}</span></div><div className="mt-5 flex items-end gap-2"><b className="text-3xl font-black">{toFa(stat.value)}</b><span className="pb-1 text-[11px] font-semibold text-ink/50">{stat.label}</span></div><p className="mt-2 text-[10px] text-ink/35">{stat.note}</p></motion.div>)}
      </section>
      <section className="grid gap-6 xl:grid-cols-[1.45fr_.8fr]">
        <div className="panel-solid overflow-hidden"><div className="flex items-center justify-between border-b border-ink/10 px-6 py-5"><div><h2 className="text-sm font-black">قراردادهای اخیر</h2><p className="mt-1 text-[10px] text-ink/35">وضعیت زنده گردش‌کار و آخرین اقدام</p></div><button onClick={() => navigate("contracts")} className="btn-ghost !min-h-9 !px-2 !text-[11px]">مشاهده همه<ArrowLeft size={14} /></button></div><div className="divide-y divide-ink/[.07]">
          {data.contracts.slice(0, 5).map((contract) => <div key={contract.id} className="group flex flex-col gap-4 px-6 py-4 transition hover:bg-stone-50/70 sm:flex-row sm:items-center"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-stone-100 text-ink/50"><FileText size={18} /></span><div className="min-w-0 flex-1"><b className="block truncate text-xs">{contract.title}</b><div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[9px] text-ink/35"><span className="ltr">{contract.number}</span><span>{contract.user?.name}</span><span>{formatDate(contract.issuedAt)}</span></div></div><StatusBadge status={contract.status} /><Link href={`/sign/${contract.id}`} target="_blank" className="grid h-9 w-9 place-items-center rounded-xl border border-ink/10 text-ink/40 transition hover:bg-ink hover:text-mint" title="مشاهده صفحه سند"><ArrowUpLeft size={15} /></Link></div>)}
        </div></div>
        <div className="panel-solid p-6"><div className="flex items-center justify-between"><div><h2 className="text-sm font-black">نبض صدور</h2><p className="mt-1 text-[10px] text-ink/35">هفت روز گذشته</p></div><ScrollText size={19} className="text-ink/30" /></div><div className="mt-7 flex h-36 items-end justify-between gap-2 border-b border-ink/10 pb-px">{days.map((day, index) => <div key={index} className="flex h-full flex-1 flex-col items-center justify-end gap-2"><span className="text-[9px] text-ink/40">{toFa(day.count)}</span><motion.div initial={{ height: 0 }} animate={{ height: `${Math.max(4, day.count / maxCount * 88)}%` }} transition={{ delay: .3 + index * .06, duration: .5 }} className={`w-full max-w-7 rounded-t-lg ${index === 6 ? "bg-mint" : "bg-ink/15"}`} /></div>)}</div><div className="mt-2 flex justify-between gap-2">{days.map((day, index) => <span key={index} className="flex-1 text-center text-[8px] text-ink/35">{day.label}</span>)}</div><div className="mt-6 rounded-2xl bg-stone-50 p-4"><div className="flex items-center justify-between text-[10px]"><span className="text-ink/45">وضعیت سندها</span><b>{toFa(total)} سند</b></div><div className="mt-3 flex h-2 overflow-hidden rounded-full bg-stone-200"><span style={{ width: `${total ? signed / total * 100 : 0}%` }} className="bg-emerald-500" /><span style={{ width: `${total ? pending / total * 100 : 0}%` }} className="bg-amber-400" /><span style={{ width: `${total ? expired / total * 100 : 0}%` }} className="bg-stone-400" /></div><div className="mt-3 flex flex-wrap gap-3 text-[9px] text-ink/40"><span>امضا {toFa(signed)}</span><span>انتظار {toFa(pending)}</span><span>منقضی {toFa(expired)}</span></div></div></div>
      </section>
      <section className="grid gap-6 lg:grid-cols-[1fr_330px]">
        <div className="panel-solid p-6"><div className="flex items-center justify-between"><h2 className="text-sm font-black">آخرین رویدادهای امن</h2><button onClick={() => navigate("audit")} className="text-[10px] font-bold text-emerald-700">دفتر کامل رویدادها</button></div><div className="mt-6 space-y-0">{data.audit.slice(0, 5).map((event, index) => <div key={event.id} className="relative flex gap-4 pb-5 last:pb-0"><div className="relative flex flex-col items-center"><span className={`mt-1 h-2.5 w-2.5 rounded-full ring-4 ${event.action.includes("signed") || event.action === "completed" ? "bg-emerald-500 ring-emerald-50" : "bg-ink/30 ring-stone-100"}`} />{index < 4 && <span className="h-full w-px bg-ink/10" />}</div><div className="min-w-0 flex-1"><p className="text-[11px] leading-6 text-ink/65">{event.description}</p><div className="mt-1 flex flex-wrap gap-2 text-[9px] text-ink/30"><span>{event.actor}</span><span>•</span><span>{formatDate(event.createdAt, true)}</span>{event.contractNumber && <span className="ltr">• {event.contractNumber}</span>}</div></div></div>)}</div></div>
        <div className="panel-solid p-6"><h2 className="text-sm font-black">میان‌برهای ساخت</h2><div className="mt-5 space-y-2"><button onClick={() => navigate("templates")} className="flex w-full items-center gap-3 rounded-2xl bg-stone-50 p-4 text-right transition hover:bg-stone-100"><FileText size={18} /><div className="flex-1"><b className="block text-[11px]">ویرایش قالب و متغیر</b><span className="text-[9px] text-ink/35">TinyMCE در نسخه وردپرس</span></div><ArrowLeft size={14} /></button><button onClick={() => navigate("issue")} className="flex w-full items-center gap-3 rounded-2xl bg-stone-50 p-4 text-right transition hover:bg-stone-100"><PenLine size={18} /><div className="flex-1"><b className="block text-[11px]">تعریف صف امضاکنندگان</b><span className="text-[9px] text-ink/35">داخلی و مشتری</span></div><ArrowLeft size={14} /></button><button onClick={() => navigate("architecture")} className="flex w-full items-center gap-3 rounded-2xl bg-stone-50 p-4 text-right transition hover:bg-stone-100"><Users size={18} /><div className="flex-1"><b className="block text-[11px]">پیکربندی ماژول‌ها</b><span className="text-[9px] text-ink/35">OTP، PDF، SMS، ووکامرس</span></div><ArrowLeft size={14} /></button></div></div>
      </section>
    </div>
  );
}
