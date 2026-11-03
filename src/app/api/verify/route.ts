import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { contracts } from "@/db/schema";
import { ensureSeed } from "@/db/seed";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  await ensureSeed();
  const url = new URL(request.url);
  const number = url.searchParams.get("number")?.trim();
  const providedHash = url.searchParams.get("hash")?.trim().toLowerCase() || "";
  if (!number) return NextResponse.json({ error: "شماره قرارداد را وارد کنید." }, { status: 400 });
  const rows = await db.select().from(contracts).where(eq(contracts.number, number)).limit(1);
  if (!rows.length) return NextResponse.json({ error: "سندی با این شماره در سامانه ثبت نشده است." }, { status: 404 });
  const contract = rows[0];
  const match = Boolean(contract.verificationHash && contract.status === "signed" && (!providedHash || contract.verificationHash.toLowerCase() === providedHash));
  return NextResponse.json({
    result: {
      number: contract.number,
      title: contract.title,
      status: contract.status,
      issuedAt: contract.issuedAt.toISOString(),
      signedAt: contract.signedAt?.toISOString() || null,
      verificationHash: contract.verificationHash,
      match,
      hashChecked: Boolean(providedHash),
      signers: contract.signers.map((signer) => ({ name: signer.name, role: signer.role, order: signer.order, status: signer.status, signedAt: signer.signedAt })),
    },
  });
}
