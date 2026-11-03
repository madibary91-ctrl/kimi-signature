"use client";

import { useRef, useState } from "react";
import { Download, LoaderCircle } from "lucide-react";
import type { ContractRecord } from "@/lib/domain";
import { ContractDocument } from "@/components/ContractDocument";

export function PdfButton({ contract, enabled = true, className = "btn-secondary" }: { contract: ContractRecord; enabled?: boolean; className?: string }) {
  const renderRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function download() {
    if (!renderRef.current || busy) return;
    setBusy(true);
    setError("");
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import("html2canvas"), import("jspdf")]);
      const canvas = await html2canvas(renderRef.current, { scale: 2, backgroundColor: "#ffffff", useCORS: true, logging: false });
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true });
      const image = canvas.toDataURL("image/jpeg", 0.94);
      const width = 210;
      const pageHeight = 297;
      const height = canvas.height * width / canvas.width;
      let remaining = height;
      let position = 0;
      pdf.addImage(image, "JPEG", 0, position, width, height, undefined, "FAST");
      remaining -= pageHeight;
      while (remaining > 0) {
        position = remaining - height;
        pdf.addPage();
        pdf.addImage(image, "JPEG", 0, position, width, height, undefined, "FAST");
        remaining -= pageHeight;
      }
      pdf.setProperties({ title: contract.title, subject: `قرارداد ${contract.number}`, creator: "امضاگیر" });
      pdf.save(`${contract.number}.pdf`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "ساخت PDF ناموفق بود.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <span className="inline-flex flex-col items-stretch gap-1">
        <button type="button" className={className} onClick={download} disabled={!enabled || busy} title={!enabled ? "ماژول PDF غیرفعال است" : "دانلود PDF واقعی سند"}>
          {busy ? <LoaderCircle size={16} className="animate-spin" /> : <Download size={16} />}
          {busy ? "در حال ساخت PDF…" : "دانلود PDF"}
        </button>
        {error && <span className="max-w-52 text-[10px] text-rose-600">{error}</span>}
      </span>
      <div aria-hidden="true" style={{ position: "fixed", top: 0, right: "-12000px", width: 794, pointerEvents: "none", zIndex: -100 }}>
        <div ref={renderRef} style={{ width: 794 }}><ContractDocument contract={contract} /></div>
      </div>
    </>
  );
}
