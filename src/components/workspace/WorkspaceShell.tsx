"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Bell, Blocks, CheckCircle2, ExternalLink, FileClock, FilePlus2, Files, FileText, LayoutDashboard, LoaderCircle, Menu, PenLine, RefreshCw, ShieldCheck, X, XCircle } from "lucide-react";
import { Brand } from "@/components/Brand";
import type { Notify, WorkspaceData, WorkspaceView } from "@/lib/workspace";
import { toFa } from "@/lib/domain";
import { Overview } from "@/components/workspace/Overview";
import { TemplatesView } from "@/components/workspace/TemplatesView";
import { IssueView } from "@/components/workspace/IssueView";
import { ContractsView } from "@/components/workspace/ContractsView";
import { AuditView } from "@/components/workspace/AuditView";
import { ArchitectureView } from "@/components/workspace/ArchitectureView";

const navigation: { id: WorkspaceView; label: string; caption: string; icon: typeof LayoutDashboard }[] = [
  { id: "overview", label: "پیشخوان", caption: "نمای کلی عملیات", icon: LayoutDashboard },
  { id: "templates", label: "قالب‌های قرارداد", caption: "متن، متغیر و نسخه", icon: FileText },
  { id: "issue", label: "صدور قرارداد", caption: "ساخت Snapshot و صف", icon: FilePlus2 },
  { id: "contracts", label: "قراردادها", caption: "پیگیری و خروجی سند", icon: Files },
  { id: "audit", label: "رویدادهای امن", caption: "Audit trail کامل", icon: FileClock },
  { id: "architecture", label: "ماژول‌ها و اتصال", caption: "معماری و تنظیمات", icon: Blocks },
];

export function WorkspaceShell() {
  const [data, setData] = useState<WorkspaceData | null>(null);
  const [active, setActive] = useState<WorkspaceView>("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error"; id: number } | null>(null);
  const [mobileMenu, setMobileMenu] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/workspace", { cache: "no-store" });
      const result = await response.json() as WorkspaceData & { error?: string };
      if (!response.ok) throw new Error(result.error || "دریافت اطلاعات میزکار ناموفق بود.");
      setData(result); setError("");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "خطای ارتباط با سرور"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { const saved = window.localStorage.getItem("emzagar-active-view") as WorkspaceView | null; if (saved && navigation.some((item) => item.id === saved)) setActive(saved); void refresh(); }, [refresh]);
  useEffect(() => { if (!toast) return; const timer = window.setTimeout(() => setToast(null), 4200); return () => window.clearTimeout(timer); }, [toast]);
  const notify: Notify = useCallback((message, type = "success") => setToast({ message, type, id: Date.now() }), []);
  function navigate(view: WorkspaceView) { setActive(view); window.localStorage.setItem("emzagar-active-view", view); setMobileMenu(false); window.scrollTo({ top: 0, behavior: "smooth" }); }
  const current = navigation.find((item) => item.id === active)!;
  const pending = data?.contracts.filter((contract) => contract.status === "pending") || [];

  if (loading) return <main className="grid min-h-screen place-items-center bg-paper"><div className="text-center"><Brand /><div className="mt-8 h-1 w-44 overflow-hidden rounded-full bg-ink/10"><motion.div className="h-full w-1/2 bg-mint" animate={{ x: ["200%", "-200%"] }} transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }} /></div><p className="mt-4 text-[10px] text-ink/35">در حال آماده‌سازی ماژول‌های میزکار…</p></div></main>;
  if (!data) return <main className="grid min-h-screen place-items-center bg-paper p-6"><div className="panel-solid max-w-md p-8 text-center"><XCircle className="mx-auto text-rose-500" /><h1 className="mt-5 font-black">اتصال به میزکار برقرار نشد</h1><p className="mt-3 text-xs leading-7 text-ink/45">{error}</p><button onClick={() => { setLoading(true); void refresh(); }} className="btn-primary mt-6"><RefreshCw size={15} />تلاش دوباره</button></div></main>;

  return <main className="min-h-screen bg-paper">
    <aside className="fixed inset-y-0 right-0 z-50 hidden w-[252px] flex-col border-l border-ink/10 bg-[#f9faf6] p-5 lg:flex"><div className="px-2 py-2"><Brand /></div><nav className="mt-8 space-y-1">{navigation.map((item) => <button key={item.id} onClick={() => navigate(item.id)} className={`group flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-right transition ${active === item.id ? "bg-ink text-white shadow-lg" : "text-ink/45 hover:bg-ink/[.045] hover:text-ink"}`}><span className={`grid h-9 w-9 place-items-center rounded-xl ${active === item.id ? "bg-white/10 text-mint" : "bg-stone-100 text-ink/35 group-hover:bg-white"}`}><item.icon size={17} /></span><div><b className="block text-[11px]">{item.label}</b><span className={`mt-0.5 block text-[8px] ${active === item.id ? "text-white/35" : "text-ink/25"}`}>{item.caption}</span></div>{item.id === "contracts" && pending.length > 0 && <span className={`mr-auto rounded-md px-1.5 py-1 text-[8px] ${active === item.id ? "bg-mint text-ink" : "bg-amber-100 text-amber-700"}`}>{toFa(pending.length)}</span>}</button>)}</nav><div className="mt-auto space-y-3">{pending[0] && <div className="rounded-2xl bg-[#e8eee8] p-4"><div className="flex items-center gap-2 text-[10px] font-bold"><PenLine size={14} />تجربه مشتری<ExternalLink size={11} className="mr-auto text-ink/30" /></div><p className="mt-2 truncate text-[9px] text-ink/40">{pending[0].number}</p><div className="mt-3 grid grid-cols-2 gap-2"><Link href={`/account/${pending[0].userId}`} target="_blank" className="rounded-lg bg-white px-2 py-2 text-center text-[9px] font-bold">داشبورد</Link><Link href={`/sign/${pending[0].id}`} target="_blank" className="rounded-lg bg-ink px-2 py-2 text-center text-[9px] font-bold text-mint">صفحه امضا</Link></div></div>}<div className="flex items-center gap-2 px-2 text-[9px] text-ink/30"><span className="h-2 w-2 rounded-full bg-emerald-500" />هسته و پایگاه‌داده متصل‌اند</div><Link href="/" className="block px-2 text-[9px] text-ink/30 hover:text-ink">← بازگشت به معرفی امضاگیر</Link></div></aside>
    <div className="lg:mr-[252px]">
      <header className="sticky top-0 z-40 border-b border-ink/10 bg-paper/90 backdrop-blur-xl"><div className="flex h-[74px] items-center justify-between gap-4 px-4 sm:px-7"><div className="flex items-center gap-3"><button onClick={() => setMobileMenu(true)} className="grid h-10 w-10 place-items-center rounded-xl border border-ink/10 lg:hidden"><Menu size={18} /></button><div><div className="flex items-center gap-2"><current.icon size={16} className="text-ink/35" /><b className="text-sm">{current.label}</b></div><p className="mt-1 hidden text-[9px] text-ink/30 sm:block">{current.caption} / محیط عملیاتی ماژولار</p></div></div><div className="flex items-center gap-2"><button onClick={() => navigate("audit")} className="relative grid h-10 w-10 place-items-center rounded-xl border border-ink/10 bg-white text-ink/45" title="رویدادهای تازه"><Bell size={16} />{data.audit.length > 0 && <span className="absolute left-2 top-2 h-1.5 w-1.5 rounded-full bg-coral" />}</button><button onClick={() => navigate("issue")} className="btn-primary !min-h-10 !px-4 max-sm:!text-[10px]"><FilePlus2 size={15} />صدور جدید</button><div className="mr-1 hidden items-center gap-2 border-r border-ink/10 pr-3 sm:flex"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#e2e9df] text-[10px] font-black">م‌ا</span><div><b className="block text-[10px]">مدیر امضاگیر</b><span className="text-[8px] text-ink/30">Administrator</span></div></div></div></div></header>
      <div className="mx-auto max-w-[1600px] p-4 sm:p-7">{error && <div className="mb-4 rounded-xl bg-amber-50 p-3 text-[10px] text-amber-800">آخرین تازه‌سازی ناموفق بود: {error}</div>}<AnimatePresence mode="wait"><motion.div key={active} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: .28 }}>{active === "overview" && <Overview data={data} navigate={navigate} />}{active === "templates" && <TemplatesView templates={data.templates} refresh={refresh} notify={notify} />}{active === "issue" && <IssueView templates={data.templates} users={data.users} settings={data.settings} refresh={refresh} notify={notify} />}{active === "contracts" && <ContractsView contracts={data.contracts} settings={data.settings} refresh={refresh} notify={notify} />}{active === "audit" && <AuditView events={data.audit} notify={notify} />}{active === "architecture" && <ArchitectureView modules={data.modules} settings={data.settings} templates={data.templates} integrations={data.integrations} refresh={refresh} notify={notify} />}</motion.div></AnimatePresence></div>
    </div>
    <AnimatePresence>{mobileMenu && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[70] bg-ink/50 backdrop-blur-sm lg:hidden"><motion.aside initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 28 }} className="mr-auto h-full w-[290px] bg-[#f9faf6] p-5 shadow-2xl"><div className="flex items-center justify-between"><Brand /><button onClick={() => setMobileMenu(false)} className="grid h-9 w-9 place-items-center rounded-xl bg-stone-100"><X size={17} /></button></div><nav className="mt-8 space-y-2">{navigation.map((item) => <button key={item.id} onClick={() => navigate(item.id)} className={`flex w-full items-center gap-3 rounded-2xl p-3 text-right ${active === item.id ? "bg-ink text-white" : "text-ink/50"}`}><item.icon size={18} className={active === item.id ? "text-mint" : ""} /><div><b className="block text-[11px]">{item.label}</b><span className={`text-[8px] ${active === item.id ? "text-white/35" : "text-ink/25"}`}>{item.caption}</span></div></button>)}</nav><div className="mt-8 rounded-2xl bg-emerald-50 p-4 text-[10px] leading-6 text-emerald-800"><ShieldCheck size={16} className="mb-2" />داده‌ها و تنظیمات روی PostgreSQL ذخیره می‌شوند و پس از بارگذاری دوباره باقی می‌مانند.</div></motion.aside></motion.div>}</AnimatePresence>
    <AnimatePresence>{toast && <motion.div key={toast.id} initial={{ opacity: 0, y: 30, scale: .95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 15, scale: .97 }} className={`fixed bottom-5 left-5 z-[100] flex max-w-[calc(100vw-40px)] items-center gap-3 rounded-2xl px-5 py-4 text-white shadow-2xl ${toast.type === "success" ? "bg-ink" : "bg-rose-700"}`}>{toast.type === "success" ? <CheckCircle2 size={18} className="shrink-0 text-mint" /> : <XCircle size={18} className="shrink-0" />}<span className="text-[11px] leading-6">{toast.message}</span><button onClick={() => setToast(null)} className="mr-2 text-white/40"><X size={14} /></button></motion.div>}</AnimatePresence>
  </main>;
}
