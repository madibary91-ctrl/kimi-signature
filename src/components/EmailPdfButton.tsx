"use client";

import { useRef, useState } from "react";
import { CheckCircle2, LoaderCircle, Mail } from "lucide-react";
import type { ContractRecord } from "@/lib/domain";
import { ContractDocument } from "@/components/ContractDocument";

export function EmailPdfButton({ contract, configured }: { contract: ContractRecord; configured: boolean }) {
  const renderRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  async function send() {
    if (!renderRef.current || !configured || busy) return;
    setBusy(true); setError(""); setMessage("");
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import("html2canvas"), import("jspdf")]);
      const canvas = await html2canvas(renderRef.current, { scale: 2, backgroundColor: "#ffffff", useCORS: true, logging: false });
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true });
      const image = canvas.toDataURL("image/jpeg", .94);
      const height = canvas.height * 210 / canvas.width;
      let remaining = height, position = 0;
      pdf.addImage(image, "JPEG", 0, position, 210, height, undefined, "FAST");
      remaining -= 297;
      while (remaining > 0) { position = remaining - height; pdf.addPage(); pdf.addImage(image, "JPEG", 0, position, 210, height, undefined, "FAST"); remaining -= 297; }
      const pdfBase64 = pdf.output("datauristring").split(",")[1];
      const response = await fetch(`/api/contracts/${contract.id}/deliver`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pdfBase64 }) });
      const data = await response.json() as { ok?: boolean; error?: string; recipients?: number };
      if (!response.ok || !data.ok) throw new Error(data.error || "ارسال ایمیل ناموفق بود.");
      setMessage(`PDF برای ${data.recipients === 2 ? "کاربر و مدیر" : "گیرنده"} ارسال شد.`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "خطا در ساخت یا ارسال PDF"); }
    finally { setBusy(false); }
  }
  return <><div className="mt-2"><button type="button" onClick={send} disabled={!configured || busy} className="btn-secondary w-full !min-h-[48px]" title={!configured ? "RESEND_API_KEY، EMAIL_FROM و ADMIN_EMAIL روی سرور لازم است" : "ساخت و ارسال واقعی PDF با Resend"}>{busy ? <LoaderCircle size={16} className="animate-spin" /> : message ? <CheckCircle2 size={16} className="text-emerald-600" /> : <Mail size={16} />}{busy ? "در حال ساخت و ارسال…" : message ? "ایمیل ارسال شد" : "ارسال PDF به ایمیل"}</button>{!configured && <p className="mt-2 text-center text-[8px] leading-5 text-ink/35">ارسال واقعی نیازمند تنظیم Resend و ایمیل مدیر روی سرور است.</p>}{message && <p className="mt-2 text-center text-[9px] text-emerald-700">{message}</p>}{error && <p className="mt-2 text-center text-[9px] leading-5 text-rose-600">{error}</p>}</div><div aria-hidden="true" style={{ position: "fixed", top: 0, right: "-12000px", width: 794, pointerEvents: "none", zIndex: -100 }}><div ref={renderRef} style={{ width: 794 }}><ContractDocument contract={contract} /></div></div></>;
}
