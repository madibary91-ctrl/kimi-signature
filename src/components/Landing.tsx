"use client";

import Link from "next/link";
import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from "motion/react";
import { ArrowLeft, ArrowDown, Blocks, Braces, Check, ChevronLeft, FileCheck2, FileText, Fingerprint, KeyRound, Layers3, LockKeyhole, MousePointer2, PenLine, ScanLine, ShieldCheck, ShoppingBag, Smartphone, Sparkles } from "lucide-react";
import { Brand } from "@/components/Brand";
import { PLUGIN_MODULES, type PluginModule } from "@/lib/modules";

const reveal = {
  hidden: { opacity: 0, y: 34, clipPath: "inset(0 0 100% 0)" },
  show: { opacity: 1, y: 0, clipPath: "inset(0 0 0% 0)", transition: { duration: .8, ease: [0.22, 1, 0.36, 1] as const } },
};

function HeroDocument({ progress, reduced }: { progress: MotionValue<number>; reduced: boolean }) {
  const scale = useTransform(progress, [0, 1], [1, .79]);
  const y = useTransform(progress, [0, 1], [0, 140]);
  const rotateX = useTransform(progress, [0, 1], [0, 14]);
  const rotateZ = useTransform(progress, [0, 1], [-3, 0]);
  return (
    <motion.div style={reduced ? undefined : { scale, y, rotateX, rotateZ, transformPerspective: 1200 }} className="relative mx-auto w-full max-w-[490px]">
      <div className="absolute -inset-12 rounded-full bg-mint/15 blur-[80px] soft-pulse" />
      <motion.div initial={{ opacity: 0, y: 70, rotate: -6 }} animate={{ opacity: 1, y: 0, rotate: -3 }} transition={{ duration: 1.1, delay: .35, ease: [0.22, 1, 0.36, 1] }} className="relative overflow-hidden rounded-[28px] bg-[#fafbf7] p-6 text-ink shadow-[0_50px_100px_rgba(0,0,0,.32)] sm:p-8">
        <div className="flex items-center justify-between border-b border-ink/10 pb-5">
          <div className="flex items-center gap-2"><span className="grid h-9 w-9 place-items-center rounded-xl bg-ink text-sm font-black text-mint">ع</span><div><b className="block text-xs">قرارداد اجرای پروژه</b><span className="text-[9px] text-ink/45">EMZ-۱۴۰۵-۱۰۵۱</span></div></div>
          <span className="badge bg-amber-100 text-amber-800"><span className="h-1.5 w-1.5 rounded-full bg-amber-500" />در انتظار امضا</span>
        </div>
        <div className="space-y-3 py-6">
          <div className="h-2.5 w-2/3 rounded-full bg-ink/15" />
          <div className="h-2 w-full rounded-full bg-ink/[.07]" />
          <div className="h-2 w-11/12 rounded-full bg-ink/[.07]" />
          <div className="h-2 w-full rounded-full bg-ink/[.07]" />
          <div className="h-2 w-4/5 rounded-full bg-ink/[.07]" />
        </div>
        <div className="rounded-2xl border border-ink/10 bg-white p-4">
          <div className="flex items-center justify-between text-[10px]"><span className="font-bold">محل امضای کارفرما</span><span className="text-emerald-700">هویت تأیید شد ✓</span></div>
          <svg viewBox="0 0 300 100" className="mt-2 h-20 w-full" fill="none">
            <motion.path d="M15 66C47 10 54 11 43 61C37 89 65 65 82 41C96 21 89 75 109 54C130 31 137 31 125 60C150 48 166 32 178 28C164 46 153 67 181 52C213 34 232 49 282 25" stroke="#153a3d" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 2.1, delay: 1.15, ease: "easeInOut" }} />
            <path d="M18 84H278" stroke="#102c31" strokeOpacity=".12" strokeDasharray="4 5" />
          </svg>
        </div>
        <div className="mt-5 flex items-center justify-between"><div className="flex -space-x-2 space-x-reverse"><span className="grid h-8 w-8 place-items-center rounded-full border-2 border-white bg-[#dce8df] text-[9px] font-bold">ن‌م</span><span className="grid h-8 w-8 place-items-center rounded-full border-2 border-white bg-[#f2dac9] text-[9px] font-bold">ل‌ر</span></div><span className="text-[9px] text-ink/45">۱ از ۲ امضا ثبت شده</span></div>
      </motion.div>
      <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.2, duration: .7 }} className="ambient-float absolute -left-10 top-24 hidden rounded-2xl border border-white/50 bg-white/90 p-3 text-ink shadow-xl backdrop-blur sm:block">
        <div className="flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-xl bg-mint/25"><Fingerprint size={16} /></span><div><b className="block text-[10px]">احراز هویت موفق</b><span className="text-[8px] text-ink/45">OTP • ۱۲۰ ثانیه</span></div></div>
      </motion.div>
      <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.45, duration: .7 }} className="absolute -right-8 bottom-20 hidden rounded-2xl border border-white/50 bg-white/90 p-3 text-ink shadow-xl backdrop-blur sm:block">
        <div className="flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-xl bg-[#e8e4ff] text-[#5a4d9b]"><ShieldCheck size={16} /></span><div><b className="block text-[10px]">ردپای دیجیتال</b><span className="text-[8px] text-ink/45">IP + SHA-256</span></div></div>
      </motion.div>
    </motion.div>
  );
}

function ConvergingCard({ module, index, progress, reduced }: { module: PluginModule; index: number; progress: MotionValue<number>; reduced: boolean }) {
  const positions = [{ x: -370, y: -180 }, { x: 330, y: -205 }, { x: -420, y: 40 }, { x: 400, y: 30 }, { x: -280, y: 225 }, { x: 290, y: 215 }];
  const pos = positions[index % positions.length];
  const x = useTransform(progress, [0, .72], [pos.x, 0]);
  const y = useTransform(progress, [0, .72], [pos.y, 0]);
  const scale = useTransform(progress, [0, .72, 1], [1, .72, .45]);
  const opacity = useTransform(progress, [0, .75, .94], [1, .7, 0]);
  const icons = [Braces, Layers3, KeyRound, PenLine, FileText, ShieldCheck];
  const Icon = icons[index % icons.length];
  return (
    <motion.div style={reduced ? { position: "relative" } : { x, y, scale, opacity, position: "absolute" }} className="z-10 w-[230px] rounded-2xl border border-ink/10 bg-white p-4 shadow-[0_16px_50px_rgba(16,44,49,.1)]">
      <div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-ink text-mint"><Icon size={17} /></span><div><b className="block text-xs">{module.name}</b><span className="text-[8px] uppercase tracking-wider text-ink/40">{module.english}</span></div></div>
    </motion.div>
  );
}

function ArchitectureScene() {
  const ref = useRef<HTMLElement>(null);
  const reduced = Boolean(useReducedMotion());
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const coreScale = useTransform(scrollYProgress, [0, .65, 1], [.75, 1, 1.08]);
  const coreRotate = useTransform(scrollYProgress, [0, 1], [-8, 0]);
  const coreText = useTransform(scrollYProgress, [0, .5, .8], [0, 0, 1]);
  const shown = PLUGIN_MODULES.filter((m) => ["templates", "workflow", "identity", "signature", "pdf", "audit"].includes(m.id));
  return (
    <section ref={ref} id="architecture" className="relative h-[190vh] bg-[#e9ece5] max-lg:h-auto max-lg:py-24">
      <div className="sticky top-0 flex h-screen min-h-[700px] flex-col overflow-hidden max-lg:relative max-lg:h-auto max-lg:min-h-0">
        <div className="mx-auto w-full max-w-7xl px-6 pt-16 text-center max-lg:pt-0">
          <span className="badge border border-ink/10 bg-white/60 text-ink/60">معماری، نه یک فایل خدا</span>
          <h2 className="mt-5 text-3xl font-black tracking-tight sm:text-5xl">هر بخش، مستقل. هر امضا، یک جریان واحد.</h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-ink/55">سرویس‌ها از طریق Container حرف می‌زنند؛ قالب، هویت و PDF می‌توانند جداگانه توسعه و آزمون شوند.</p>
        </div>
        <div className="relative mx-auto mt-8 flex w-full max-w-6xl flex-1 items-center justify-center max-lg:grid max-lg:grid-cols-2 max-lg:gap-4 max-lg:px-6 max-sm:grid-cols-1">
          {shown.map((module, index) => <ConvergingCard key={module.id} module={module} index={index} progress={scrollYProgress} reduced={reduced} />)}
          <motion.div style={reduced ? undefined : { scale: coreScale, rotate: coreRotate, opacity: coreText }} className="z-20 grid h-56 w-56 place-items-center rounded-[48px] bg-ink text-center text-white shadow-[0_30px_80px_rgba(16,44,49,.25)] max-lg:hidden">
            <div><span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-mint text-ink"><Blocks size={24} /></span><b className="mt-4 block text-xl">Emzagar Core</b><span className="mt-2 block text-[10px] text-white/50">STATE MACHINE + CONTAINER</span><div className="mx-auto mt-4 h-1 w-16 rounded-full bg-mint" /></div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export function Landing() {
  const heroRef = useRef<HTMLElement>(null);
  const reduced = Boolean(useReducedMotion());
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const backgroundY = useTransform(scrollYProgress, [0, 1], [0, 220]);
  const titleY = useTransform(scrollYProgress, [0, 1], [0, 100]);
  const features = [
    { icon: Braces, title: "متغیرهای پویا", text: "متغیرهای [USER_NAME] و [ORDER_ID] هنگام صدور با داده واقعی پر می‌شوند؛ متن صادرشده Snapshot و نسخه‌بندی می‌شود.", link: "۱۱ متغیر آماده" },
    { icon: PenLine, title: "امضای ترسیم یا تصویر", text: "بوم لمسی با ضربه‌های نرم، لغو آخرین ضربه، انتخاب قلم و آپلود امن PNG/JPG؛ نه صرفاً ذخیره یک تصویر نمایشی.", link: "۲ روش امضا" },
    { icon: KeyRound, title: "هویت پیش از امضا", text: "کد شش‌رقمی هش‌شده با انقضا، تلاش محدود، قفل ارسال مجدد و اتصال واقعی به کاوه‌نگار در صورت تنظیم کلید.", link: "۵ تلاش مجاز" },
    { icon: Layers3, title: "ترتیب امضاکنندگان", text: "مالی، فروش و مشتری هر کدام نوبت خود را دارند. گذار وضعیت و فعال شدن نفر بعدی توسط موتور گردش‌کار انجام می‌شود.", link: "گردش‌کار چندمرحله‌ای" },
    { icon: FileCheck2, title: "PDF و شناسنامه سند", text: "خروجی A4 چندصفحه‌ای از خود سند فارسی، شامل امضاها، زمان، IP و اثر انگشت SHA-256 برای استعلام نسخه.", link: "دانلود PDF واقعی" },
    { icon: ShoppingBag, title: "پل ووکامرس", text: "وب‌هوک سفارش با کلید مشترک، نگاشت محصول به قالب و صدور خودکار؛ ماژول حساب کاربری و شورت‌کد نیز در معماری دیده شده است.", link: "WooCommerce ready" },
  ];
  return (
    <main className="overflow-clip">
      <section ref={heroRef} className="relative min-h-[100svh] overflow-hidden bg-ink text-white">
        <motion.div style={reduced ? undefined : { y: backgroundY }} className="hero-grid absolute -inset-y-40 inset-x-0" />
        <div className="noise absolute inset-0" />
        <div className="absolute -right-32 top-1/3 h-[420px] w-[420px] rounded-full bg-[#29615c]/30 blur-[120px]" />
        <header className="relative z-30 mx-auto flex h-24 max-w-[1440px] items-center justify-between px-6 lg:px-10">
          <Brand light />
          <nav className="hidden items-center gap-8 text-xs text-white/60 md:flex"><a href="#features" className="transition hover:text-white">قابلیت‌ها</a><a href="#architecture" className="transition hover:text-white">معماری ماژولار</a><a href="#workflow" className="transition hover:text-white">جریان کار</a><Link href="/verify" className="transition hover:text-white">استعلام سند</Link></nav>
          <Link href="/workspace" className="btn-primary btn-mint !min-h-10 !px-4">میزکار زنده<ArrowLeft size={15} /></Link>
        </header>
        <div className="relative z-10 mx-auto grid min-h-[calc(100svh-96px)] max-w-[1440px] items-center gap-12 px-6 pb-20 pt-8 lg:grid-cols-[1.08fr_.92fr] lg:px-10 lg:pb-24">
          <motion.div style={reduced ? undefined : { y: titleY }} initial="hidden" animate="show" transition={{ staggerChildren: .12 }} className="max-w-3xl">
            <motion.div variants={reveal} className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[.055] px-4 py-2 text-[11px] text-white/65 backdrop-blur"><Sparkles size={13} className="text-mint" />افزونه ماژولار وردپرس، سازگار با ووکامرس<span className="h-1 w-1 rounded-full bg-mint" />نسخه معماری ۱.۰</motion.div>
            <h1 className="text-balance text-[48px] font-black leading-[1.25] tracking-[-.045em] sm:text-[66px] lg:text-[76px]">
              <span className="block overflow-hidden"><motion.span variants={reveal} className="block">قرارداد را فقط</motion.span></span>
              <span className="block overflow-hidden"><motion.span variants={reveal} className="block">امضا نکن؛ <span className="text-mint">جریانش بده.</span></motion.span></span>
            </h1>
            <motion.p variants={reveal} className="mt-7 max-w-xl text-sm leading-8 text-white/58 sm:text-base">از قالب و متغیر پویا تا احراز هویت، نوبت امضا و PDF نهایی. امضاگیر تمام مسیر قرارداد را در یک هسته منسجم و ماژول‌های قابل توسعه به هم وصل می‌کند.</motion.p>
            <motion.div variants={reveal} className="mt-9 flex flex-wrap items-center gap-3"><Link href="/workspace" className="btn-primary btn-mint !min-h-[52px] !px-6">ساخت و امضای یک قرارداد<ArrowLeft size={18} /></Link><a href="#architecture" className="btn-secondary !min-h-[52px] !border-white/10 !bg-white/[.06] !px-6 !text-white hover:!bg-white/10">کاوش در معماری<ChevronLeft size={17} /></a></motion.div>
            <motion.div variants={reveal} className="mt-12 flex flex-wrap gap-x-8 gap-y-4 border-t border-white/10 pt-6">
              {[ ["۹", "ماژول مستقل"], ["۲", "روش ثبت امضا"], ["۱", "ردپای قابل استعلام"] ].map(([value, label]) => <div key={label} className="flex items-center gap-3"><b className="text-2xl font-black text-mint">{value}</b><span className="text-[10px] text-white/45">{label}</span></div>)}
            </motion.div>
          </motion.div>
          <HeroDocument progress={scrollYProgress} reduced={reduced} />
        </div>
        <a href="#features" aria-label="رفتن به قابلیت‌ها" className="absolute bottom-6 left-1/2 z-20 hidden -translate-x-1/2 items-center gap-2 text-[10px] text-white/35 lg:flex"><ArrowDown size={13} className="animate-bounce" />برای گردش در سند اسکرول کنید</a>
      </section>

      <section className="border-b border-ink/10 bg-[#fafaf6] py-5">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-10 gap-y-3 px-6 text-[11px] font-semibold text-ink/50"><span className="flex items-center gap-2"><Check size={14} className="text-emerald-600" />WordPress 5.8+</span><span className="flex items-center gap-2"><Check size={14} className="text-emerald-600" />WooCommerce 5+</span><span className="flex items-center gap-2"><Check size={14} className="text-emerald-600" />PHP 7.4+</span><span className="flex items-center gap-2"><Check size={14} className="text-emerald-600" />ذخیره‌سازی خصوصی</span><span className="flex items-center gap-2"><Check size={14} className="text-emerald-600" />GPL v2+</span></div>
      </section>

      <section id="features" className="bg-paper px-6 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl">
          <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .4 }} transition={{ duration: .75 }} className="grid gap-6 lg:grid-cols-2 lg:items-end">
            <div><span className="badge bg-ink text-mint">یک قرارداد، تمام مسیر</span><h2 className="mt-5 max-w-xl text-4xl font-black leading-tight tracking-tight sm:text-5xl">کمتر از عکس امضا،<br />بیشتر از یک فرم.</h2></div>
            <p className="max-w-lg text-sm leading-8 text-ink/55 lg:justify-self-end">هر قابلیت به داده و وضعیت مشترک متصل است. قالبی که می‌سازید، همان قالبی است که صادر، امضا، حسابرسی و دانلود می‌شود.</p>
          </motion.div>
          <div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => <motion.article key={feature.title} initial={{ opacity: 0, y: 45, rotate: index % 2 ? 1.5 : -1.5 }} whileInView={{ opacity: 1, y: 0, rotate: 0 }} viewport={{ once: true, amount: .25 }} transition={{ duration: .65, delay: index % 3 * .08 }} className="group flex min-h-[270px] flex-col rounded-[26px] border border-ink/10 bg-white/60 p-7 transition duration-300 hover:-translate-y-1 hover:bg-white hover:shadow-[0_24px_60px_rgba(16,44,49,.08)]"><div className="flex items-start justify-between"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-ink text-mint transition group-hover:rotate-3 group-hover:scale-105"><feature.icon size={22} /></span><span className="text-[10px] font-bold text-ink/30">۰{index + 1}</span></div><h3 className="mt-7 text-lg font-black">{feature.title}</h3><p className="mt-3 flex-1 text-xs leading-7 text-ink/55">{feature.text}</p><div className="mt-5 border-t border-ink/10 pt-4 text-[10px] font-bold text-emerald-700">{feature.link}</div></motion.article>)}
          </div>
        </div>
      </section>

      <ArchitectureScene />

      <section id="workflow" className="bg-[#fafaf6] px-6 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-[.75fr_1.25fr]">
            <div><span className="badge border border-ink/10 text-ink/55">از مدیر تا مشتری</span><h2 className="mt-5 text-4xl font-black leading-tight">چهار گام تا<br />سند قطعی.</h2><p className="mt-5 text-sm leading-8 text-ink/55">وضعیت قرارداد فقط از مسیرهای مجاز تغییر می‌کند. امضای مرحله دوم پیش از مرحله اول ممکن نیست و هر گذار در لاگ ثبت می‌شود.</p><Link href="/workspace" className="btn-primary mt-8">اجرای این جریان<ArrowLeft size={16} /></Link></div>
            <div className="space-y-3">
              {[
                { n: "۰۱", icon: FileText, actor: "مدیر", title: "قالب و متغیرها را تعریف می‌کند", text: "متن، نقش امضاکننده‌ها و نسخه قالب ثبت می‌شود. متغیرها پیش از صدور پیش‌نمایش دارند." },
                { n: "۰۲", icon: MousePointer2, actor: "مدیر / ووکامرس", title: "قرارداد برای کاربر صادر می‌شود", text: "یک Snapshot مستقل ساخته می‌شود؛ نوبت نخست فعال و مهلت امضا مشخص می‌شود." },
                { n: "۰۳", icon: Smartphone, actor: "امضاکننده", title: "هویت را تأیید و سند را امضا می‌کند", text: "OTP معتبر، مطالعه مفاد، ترسیم یا آپلود و رضایت صریح پیش از ثبت کنترل می‌شود." },
                { n: "۰۴", icon: ScanLine, actor: "سیستم", title: "اثر انگشت و PDF نهایی ساخته می‌شود", text: "پس از آخرین امضا، هش سند ثبت و خروجی A4 همراه شناسنامه دیجیتال آماده دانلود است." },
              ].map((step, index) => <motion.div key={step.n} initial={{ opacity: 0, x: 60 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, amount: .4 }} transition={{ duration: .65, delay: index * .07 }} className="group grid grid-cols-[52px_1fr] gap-5 rounded-3xl border border-ink/10 bg-white p-6 sm:grid-cols-[60px_1fr] sm:p-7"><div className="flex flex-col items-center"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#eef1eb] text-ink transition group-hover:bg-ink group-hover:text-mint"><step.icon size={20} /></span>{index < 3 && <span className="mt-3 h-7 w-px bg-ink/10" />}</div><div><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-black">{step.title}</h3><span className="badge bg-stone-100 text-stone-500">{step.actor}</span></div><p className="mt-2 text-xs leading-7 text-ink/50">{step.text}</p></div></motion.div>)}
            </div>
          </div>
          <div className="mt-24 overflow-hidden rounded-[32px] bg-ink text-white">
            <div className="grid lg:grid-cols-[1fr_1.2fr]">
              <div className="p-8 sm:p-12"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-mint text-ink"><LockKeyhole size={22} /></span><h2 className="mt-7 text-3xl font-black">امنیت لایه‌به‌لایه،<br />نه یک چک‌باکس.</h2><p className="mt-4 text-xs leading-7 text-white/50">در معماری وردپرس، همه کنترلرها از Nonce و Capability عبور می‌کنند. در میزکار وب نیز OTP و وضعیت امضا سمت سرور اعتبارسنجی می‌شوند.</p></div>
              <div className="grid gap-px bg-white/10 sm:grid-cols-2">
                {[ ["Nonce + CSRF", "توکن یکبارمصرف برای فرم و AJAX"], ["جداسازی کاربران", "Policy جداگانه برای هر سند و امضاکننده"], ["ذخیره خصوصی", "PDF خارج از ریشه عمومی و دانلود کنترل‌شده"], ["ردپای کامل", "IP، User-Agent، زمان و عملیات تغییرناپذیر"] ].map(([title, text]) => <div key={title} className="bg-ink p-7"><ShieldCheck size={18} className="text-mint" /><b className="mt-4 block text-sm">{title}</b><p className="mt-2 text-[10px] leading-6 text-white/45">{text}</p></div>)}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-mint px-6 py-20 text-ink sm:py-24">
        <div className="absolute -left-20 -top-28 h-96 w-96 rounded-full border-[70px] border-ink/[.04]" />
        <div className="relative mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 md:flex-row md:items-center"><div><span className="text-[11px] font-bold text-ink/55">گردش قرارداد سایتتان را امروز راه بیندازید</span><h2 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">اولین قرارداد، چند کلیک فاصله دارد.</h2></div><Link href="/workspace" className="btn-primary !min-h-[56px] !rounded-2xl !px-7">ورود به میزکار زنده<ArrowLeft size={19} /></Link></div>
      </section>
      <footer className="bg-ink px-6 py-10 text-white"><div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 sm:flex-row"><Brand light /><p className="text-center text-[10px] leading-6 text-white/35">معماری ماژولار قرارداد و امضا برای وردپرس و ووکامرس<br />میزکار وب، نمونه اجرایی زنده از همان مدل داده و گردش‌کار است.</p><span className="text-[9px] tracking-widest text-white/30">EMZAGAR © ۲۰۲۶</span></div></footer>
    </main>
  );
}
