import Link from "next/link";

export function Brand({ light = false, href = "/" }: { light?: boolean; href?: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-3" aria-label="امضاگیر، صفحه نخست">
      <span className={`grid h-10 w-10 place-items-center rounded-[13px] ${light ? "bg-mint text-ink" : "bg-ink text-mint"}`}>
        <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden="true">
          <path d="M4 16.5C7.4 10.2 8.2 7.8 9.2 8.7C10.5 9.9 6.4 18.5 10.2 15.1C13 12.5 13.6 10.1 14.1 11.4C14.8 13.2 12.8 17.1 16 14.7L21.5 9.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M5 21H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </span>
      <span className="leading-none">
        <span className={`block text-[20px] font-black tracking-tight ${light ? "text-white" : "text-ink"}`}>امضاگیر</span>
        <span className={`mt-1 block text-[8px] font-medium tracking-[.18em] ${light ? "text-white/45" : "text-ink/45"}`}>EMZAGAR / SIGN FLOW</span>
      </span>
    </Link>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; classes: string; dot: string }> = {
    pending: { label: "در انتظار امضا", classes: "bg-amber-50 text-amber-800 border border-amber-200/70", dot: "bg-amber-500" },
    signed: { label: "امضا شده", classes: "bg-emerald-50 text-emerald-800 border border-emerald-200/70", dot: "bg-emerald-500" },
    expired: { label: "منقضی شده", classes: "bg-stone-100 text-stone-600 border border-stone-200", dot: "bg-stone-400" },
    cancelled: { label: "لغو شده", classes: "bg-rose-50 text-rose-700 border border-rose-200", dot: "bg-rose-400" },
    active: { label: "فعال", classes: "bg-emerald-50 text-emerald-800", dot: "bg-emerald-500" },
    draft: { label: "پیش‌نویس", classes: "bg-stone-100 text-stone-600", dot: "bg-stone-400" },
  };
  const item = map[status] || { label: status, classes: "bg-stone-100 text-stone-600", dot: "bg-stone-400" };
  return <span className={`badge ${item.classes}`}><span className={`h-1.5 w-1.5 rounded-full ${item.dot}`} />{item.label}</span>;
}
