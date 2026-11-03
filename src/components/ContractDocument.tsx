"use client";

import { forwardRef } from "react";
import type { ContractRecord } from "@/lib/domain";
import { formatDate, renderContract, toFa } from "@/lib/domain";

export const ContractDocument = forwardRef<HTMLDivElement, { contract: ContractRecord; compact?: boolean }>(
  function ContractDocument({ contract, compact = false }, ref) {
    const rendered = renderContract(contract.content, contract.variables);
    const lines = rendered.split("\n");
    return (
      <div ref={ref} className="contract-paper" style={compact ? { padding: "36px 42px" } : undefined}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "2px solid #102c31", paddingBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: 11, background: "#102c31", color: "#41e4ad", display: "grid", placeItems: "center", fontSize: 22, fontWeight: 900 }}>ع</div>
            <div><div style={{ fontWeight: 900, fontSize: 18, lineHeight: 1.4 }}>امضاگیر</div><div style={{ fontSize: 8, letterSpacing: 2, color: "#6c797b" }}>EMZAGAR DIGITAL EVIDENCE</div></div>
          </div>
          <div style={{ textAlign: "left", direction: "ltr", fontSize: 10, color: "#657376" }}>
            <div>{contract.number}</div><div>VERSION {toFa(contract.templateVersion)}</div>
          </div>
        </div>
        <div>
          {lines.map((line, index) => {
            const trimmed = line.trim();
            if (!trimmed) return <div key={index} style={{ height: 7 }} />;
            if (index === 0) return <h1 className="doc-title" key={index}>{trimmed}</h1>;
            if (index === 1 && !/^[۰-۹0-9]+[.．]/.test(trimmed)) return <div className="doc-subtitle" key={index}>{trimmed}</div>;
            if (/^[۰-۹0-9]+[.．]/.test(trimmed)) return <h2 className="doc-clause" key={index}>{trimmed}</h2>;
            return <p className="doc-paragraph" key={index}>{trimmed}</p>;
          })}
        </div>
        <div style={{ marginTop: 38, borderTop: "1px solid #dce1dc", paddingTop: 22 }}>
          <div style={{ fontWeight: 800, marginBottom: 14 }}>امضاها و شناسنامه دیجیتال</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 14 }}>
            {contract.signers.map((signer) => (
              <div key={signer.id} style={{ border: "1px solid #dce1dc", borderRadius: 12, padding: 14, minHeight: 148 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 11 }}>
                  <strong>{signer.name}</strong><span style={{ color: "#6b7779" }}>{toFa(signer.order)}. {signer.role}</span>
                </div>
                <div style={{ height: 72, display: "grid", placeItems: "center", borderBottom: "1px solid #e8ebe7" }}>
                  {signer.signatureData ? <img src={signer.signatureData} alt={`امضای ${signer.name}`} className="signature-image" /> : <span style={{ color: "#98a19e", fontSize: 10 }}>در انتظار امضا</span>}
                </div>
                <div style={{ fontSize: 9, color: "#667375", marginTop: 8, lineHeight: 1.9 }}>
                  <div>زمان: {formatDate(signer.signedAt, true)}</div>
                  {signer.ip && <div style={{ direction: "ltr", textAlign: "right" }}>IP: {signer.ip}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ marginTop: 24, background: "#f3f6f2", borderRadius: 10, padding: "12px 14px", fontSize: 9, color: "#5e6d6e", lineHeight: 1.9 }}>
          <div>صادر شده: {formatDate(contract.issuedAt, true)} {contract.signedAt ? `| نهایی شده: ${formatDate(contract.signedAt, true)}` : ""}</div>
          {contract.verificationHash && <div style={{ direction: "ltr", overflowWrap: "anywhere", textAlign: "left" }}>SHA-256: {contract.verificationHash}</div>}
          <div>این سند توسط امضاگیر تولید شده است. اعتبار اثر انگشت با نسخه ثبت‌شده در سامانه قابل استعلام است.</div>
        </div>
      </div>
    );
  },
);
