"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, ChevronLeft, Clock3, FileLock2, Fingerprint, LoaderCircle, LockKeyhole, PenLine, RefreshCw, ShieldCheck, Smartphone } from "lucide-react";
import { Brand, StatusBadge } from "@/components/Brand";
import { ContractDocument } from "@/components/ContractDocument";
import { EmailPdfButton } from "@/components/EmailPdfButton";
import { PdfButton } from "@/components/PdfButton";
import { SignatureCapture } from "@/components/SignatureCapture";
import type { ContractRecord, SignatureMethod } from "@/lib/domain";
import { formatDate, toFa } from "@/lib/domain";

type SigningConfig = { otpRequired: boolean; pdfEnabled: boolean; smsProvider: "demo" | "kavenegar"; resendSeconds: number; emailConfigured: boolean };
type Stage = "identity" | "sign" | "done";

export function SignExperience({ id }: { id: string }) {
  const [contract, setContract] = useState<ContractRecord | null>(null);
  const [config, setConfig] = useState<SigningConfig | null>(null);
  const [stage, setStage] = useState<Stage>("identity");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [challengeId, setChallengeId] = useState("");
  const [code, setCode] = useState("");
  const [developmentCode, setDevelopmentCode] = useState("");
  const [remaining, setRemaining] = useState(0);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [signatureMethod, setSignatureMethod] = useState<SignatureMethod>("draw");
  const [consent, setConsent] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/contracts/${id}`, { cache: "no-store" });
      const data = await response.json() as { contract?: ContractRecord; signing?: SigningConfig; error?: string };
      if (!response.ok || !data.contract || !data.signing) throw new Error(data.error || "قرارداد در دسترس نیست.");
      setContract(data.contract);
      setConfig(data.signing);
      setStage(data.contract.status === "pending" ? data.signing.otpRequired ? "identity" : "sign" : "done");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "خطای ارتباط با سرور"); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (remaining <= 0) return;
    const timer = window.setInterval(() => setRemaining((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [remaining]);

  const signer = contract?.signers[contract.currentSigner];

  async function requestCode() {
    if (!signer || busy) return;
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/contracts/${id}/otp`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "send", signerId: signer.id }) });
      const data = await response.json() as { challengeId?: string; developmentCode?: string; resendIn?: number; remaining?: number; error?: string };
      if (!response.ok && !(response.status === 429 && data.challengeId)) throw new Error(data.error || "ارسال کد ناموفق بود.");
      setChallengeId(data.challengeId || "");
      setDevelopmentCode(data.developmentCode || "");
      setRemaining(data.resendIn || data.remaining || config?.resendSeconds || 120);
      setCode("");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "خطا در ارسال کد"); }
    finally { setBusy(false); }
  }

  async function verifyCode() {
    if (!signer || code.length !== 6 || busy) return;
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/contracts/${id}/otp`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "verify", signerId: signer.id, challengeId, code }) });
      const data = await response.json() as { verified?: boolean; error?: string };
      if (!response.ok || !data.verified) throw new Error(data.error || "تأیید کد ناموفق بود.");
      setStage("sign");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "خطا در تأیید کد"); }
    finally { setBusy(false); }
  }

  async function submitSignature() {
    if (!signer || !signatureData || !consent || busy) return;
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/contracts/${id}/sign`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ signerId: signer.id, challengeId, signatureData, signatureMethod, consent }) });
      const data = await response.json() as { contract?: ContractRecord; completed?: boolean; error?: string };
      if (!response.ok || !data.contract) throw new Error(data.error || "ثبت امضا ناموفق بود.");
      setContract(data.contract);
      setStage("done");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (cause) { setError(cause instanceof Error ? cause.message : "خطا در ثبت امضا"); }
    finally { setBusy(false); }
  }

  if (loading) return <main className="grid min-h-screen place-items-center bg-paper"><div className="text-center"><LoaderCircle className="mx-auto animate-spin text-ink/35" /><p className="mt-4 text-xs text-ink/45">در حال دریافت سند امن…</p></div></main>;
  if (!contract || !config) return <main className="grid min-h-screen place-items-center bg-paper px-6"><div className="panel-solid max-w-md p-8 text-center"><FileLock2 className="mx-auto text-rose-500" /><h1 className="mt-5 text-xl font-black">سند در دسترس نیست</h1><p className="mt-3 text-xs leading-7 text-ink/50">{error}</p><Link href="/" className="btn-primary mt-6">بازگشت به امضاگیر</Link></div></main>;

  const nextSigner = contract.status === "pending" ? contract.signers[contract.currentSigner] : null;
  return (
    <main className="min-h-screen bg-[#eef0ea]">
      <header className="sticky top-0 z-40 border-b border-ink/10 bg-[#f7f8f3]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-[1500px] items-center justify-between px-5 lg:px-8"><Brand /><div className="flex items-center gap-3"><span className="hidden items-center gap-2 text-[10px] text-ink/45 sm:flex"><LockKeyhole size={13} className="text-emerald-600" />ارتباط امن • احراز هویت سمت سرور</span><StatusBadge status={contract.status} /></div></div>
      </header>
      <div className="mx-auto max-w-[1500px] px-5 py-7 lg:px-8 lg:py-10">
        <div className="mb-7 flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><div className="mb-2 flex items-center gap-2 text-[10px] text-ink/40"><Link href="/" className="hover:text-ink">امضاگیر</Link><ChevronLeft size={12} /><span>{contract.number}</span></div><h1 className="text-2xl font-black sm:text-3xl">{contract.title}</h1><p className="mt-2 text-xs text-ink/45">صدور {formatDate(contract.issuedAt)} {contract.expiresAt ? `• مهلت امضا تا ${formatDate(contract.expiresAt)}` : ""}</p></div><div className="flex items-center gap-2">{contract.signers.map((item, index) => <div key={item.id} className="flex items-center gap-2"><div className={`grid h-8 w-8 place-items-center rounded-full text-[10px] font-bold ${item.status === "signed" ? "bg-emerald-600 text-white" : index === contract.currentSigner && contract.status === "pending" ? "bg-ink text-mint" : "bg-white text-ink/35"}`}>{item.status === "signed" ? <Check size={14} /> : toFa(item.order)}</div>{index < contract.signers.length - 1 && <div className="h-px w-5 bg-ink/15 sm:w-9" />}</div>)}</div></div>
        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.2fr)_430px]">
          <section className="min-w-0 overflow-hidden rounded-[26px] border border-ink/10 bg-white shadow-sm"><div className="flex items-center justify-between border-b border-ink/10 px-5 py-4"><span className="flex items-center gap-2 text-xs font-bold"><FileLock2 size={16} />پیش‌نمایش سند</span><span className="text-[10px] text-ink/35">نسخه قالب {toFa(contract.templateVersion)}</span></div><div className="thin-scroll max-h-[1100px] overflow-auto bg-[#e7e9e3] p-3 sm:p-7"><div className="mx-auto max-w-[794px] shadow-lg"><ContractDocument contract={contract} compact /></div></div></section>
          <aside className="xl:sticky xl:top-28">
            <AnimatePresence mode="wait">
              {stage === "identity" && signer && <motion.section key="identity" initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 30 }} className="panel-solid p-6 sm:p-7">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-ink text-mint"><Fingerprint size={23} /></span><h2 className="mt-5 text-xl font-black">تأیید هویت پیش از امضا</h2><p className="mt-3 text-xs leading-7 text-ink/50">{signer.name} عزیز، برای اثبات هویت، شماره موبایل ثبت‌شده برای نقش «{signer.role}» را با کد یکبارمصرف تأیید کنید.</p>
                <div className="mt-6 flex items-center gap-3 rounded-2xl bg-stone-50 p-4"><Smartphone size={18} className="text-ink/40" /><div><span className="block text-[10px] text-ink/40">شماره امضاکننده</span><b className="ltr mt-1 block text-left text-sm">{toFa(signer.phone)}</b></div></div>
                {!challengeId ? <button type="button" onClick={requestCode} disabled={busy} className="btn-primary mt-5 w-full !min-h-[50px]">{busy ? <LoaderCircle size={17} className="animate-spin" /> : <Smartphone size={17} />}ارسال کد تأیید</button> : <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-6"><label className="label" htmlFor="otp">کد تأیید ۶ رقمی</label><input id="otp" className="input otp-input" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d))).replace(/\D/g, "").slice(0, 6))} placeholder="——————" /><button type="button" onClick={verifyCode} disabled={busy || code.length !== 6} className="btn-primary mt-3 w-full !min-h-[50px]">{busy ? <LoaderCircle size={17} className="animate-spin" /> : <CheckCircle2 size={17} />}تأیید کد و ادامه</button><button type="button" onClick={requestCode} disabled={busy || remaining > 0} className="btn-ghost mt-2 w-full !text-[11px]"><RefreshCw size={13} />{remaining > 0 ? `ارسال مجدد تا ${toFa(remaining)} ثانیه دیگر` : "ارسال مجدد کد"}</button></motion.div>}
                {developmentCode && <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4"><div className="flex items-center justify-between gap-3"><div><b className="text-[11px] text-amber-900">حالت آزمایشی فعال است</b><p className="mt-1 text-[9px] leading-5 text-amber-800/70">پیامک واقعی ارسال نشد؛ این کد فقط برای آزمون محلی نمایش داده می‌شود.</p></div><button type="button" onClick={() => setCode(developmentCode)} className="rounded-lg bg-white px-3 py-2 font-mono text-sm font-bold tracking-widest text-amber-900">{toFa(developmentCode)}</button></div></div>}
              </motion.section>}
              {stage === "sign" && signer && <motion.section key="sign" initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 30 }} className="panel-solid p-6 sm:p-7">
                <div className="flex items-center justify-between"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-ink text-mint"><PenLine size={22} /></span>{config.otpRequired && <span className="badge bg-emerald-50 text-emerald-700"><ShieldCheck size={13} />هویت شما تأیید شد</span>}</div><h2 className="mt-5 text-xl font-black">امضای {signer.role}</h2><p className="mt-2 text-xs leading-7 text-ink/50">سند مقابل را مطالعه کنید و امضای {signer.name} را ترسیم یا آپلود کنید.</p><div className="mt-6"><SignatureCapture onChange={(data, method) => { setSignatureData(data); setSignatureMethod(method); }} /></div>
                <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-2xl bg-stone-50 p-4 text-[11px] leading-6 text-ink/60"><input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1 h-4 w-4 accent-[#102c31]" /><span>متن قرارداد را مطالعه کرده‌ام و با تمام مفاد آن موافقم. می‌پذیرم این امضا به نام من و با اطلاعات احراز هویت من ثبت شود.</span></label>
                <button type="button" onClick={submitSignature} disabled={!signatureData || !consent || busy} className="btn-primary mt-4 w-full !min-h-[52px]">{busy ? <LoaderCircle size={18} className="animate-spin" /> : <PenLine size={18} />}{busy ? "در حال ثبت امن امضا…" : "ثبت و تأیید امضا"}</button>
                <p className="mt-4 flex items-start gap-2 text-[9px] leading-5 text-ink/40"><LockKeyhole size={13} className="mt-0.5 shrink-0" />امضای شما با IP، User-Agent و زمان دقیق ثبت می‌شود. برای استفاده حقوقی واقعی، الزامات قوانین محل فعالیت را بررسی کنید.</p>
              </motion.section>}
              {stage === "done" && <motion.section key="done" initial={{ opacity: 0, scale: .94 }} animate={{ opacity: 1, scale: 1 }} className="panel-solid overflow-hidden p-7 text-center">
                <motion.span initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", delay: .15 }} className={`mx-auto grid h-16 w-16 place-items-center rounded-full ${contract.status === "signed" ? "bg-emerald-100 text-emerald-700" : contract.status === "pending" ? "bg-mint/25 text-ink" : "bg-stone-100 text-stone-500"}`}>{contract.status === "signed" || contract.status === "pending" ? <Check size={30} /> : <Clock3 size={28} />}</motion.span>
                <h2 className="mt-6 text-2xl font-black">{contract.status === "signed" ? "قرارداد کامل امضا شد" : contract.status === "pending" ? "امضای شما ثبت شد" : contract.status === "expired" ? "مهلت امضا تمام شده" : "این قرارداد قابل امضا نیست"}</h2>
                <p className="mt-3 text-xs leading-7 text-ink/50">{contract.status === "signed" ? "همه امضاکنندگان سند را تأیید کردند و اثر انگشت نهایی قرارداد ثبت شده است." : contract.status === "pending" && nextSigner ? `نوبت امضا به ${nextSigner.name} (${nextSigner.role}) منتقل شد. دیگر نیازی به اقدام شما نیست.` : "برای اطلاعات بیشتر با صادرکننده قرارداد در تماس باشید."}</p>
                {contract.status === "signed" && <><div className="mt-6 rounded-2xl bg-stone-50 p-4 text-right"><span className="text-[9px] text-ink/40">اثر انگشت SHA-256</span><p className="ltr mt-2 break-all text-left font-mono text-[9px] leading-5 text-ink/60">{contract.verificationHash}</p></div><PdfButton contract={contract} enabled={config.pdfEnabled} className="btn-primary mt-4 w-full !min-h-[50px]" /><EmailPdfButton contract={contract} configured={config.emailConfigured && config.pdfEnabled} /><Link href={`/verify?number=${encodeURIComponent(contract.number)}&hash=${encodeURIComponent(contract.verificationHash || "")}`} className="btn-secondary mt-2 w-full"><ShieldCheck size={15} />استعلام اصالت سند</Link></>}
                <Link href="/" className="btn-ghost mt-3 w-full">بازگشت به امضاگیر<ArrowRight size={15} /></Link>
              </motion.section>}
            </AnimatePresence>
            {error && <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-[11px] leading-6 text-rose-700">{error}</motion.div>}
            {stage !== "done" && <div className="mt-4 flex items-center justify-center gap-2 text-[9px] text-ink/35"><ShieldCheck size={12} />Nonce • Policy • Audit Trail</div>}
          </aside>
        </div>
      </div>
    </main>
  );
}
