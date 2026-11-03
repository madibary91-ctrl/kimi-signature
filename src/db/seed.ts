import { createHash } from "node:crypto";
import { db } from "@/db";
import { auditEvents, contracts, settings, templates, users } from "@/db/schema";
import { DEFAULT_SETTINGS, type Signer } from "@/lib/domain";

const ago = (days: number, hours = 0) => new Date(Date.now() - days * 86400000 - hours * 3600000);
const ahead = (days: number) => new Date(Date.now() + days * 86400000);

function drawnSignature(variant: number) {
  const paths = [
    "M18 78 C55 10 52 116 86 55 S126 28 106 84 S160 92 190 38 M48 92 C106 74 170 104 232 62",
    "M16 72 C44 28 64 26 52 82 C84 28 118 38 92 78 C132 56 152 30 142 82 C176 58 202 62 232 40 M32 98 L214 92",
    "M20 82 C50 42 58 18 70 32 C84 52 42 100 90 70 C126 46 114 94 152 62 S202 42 230 68 M44 100 C104 90 156 104 218 88",
  ];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="250" height="120" viewBox="0 0 250 120"><path d="${paths[variant % paths.length]}" fill="none" stroke="#172d3d" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

function signer(input: Partial<Signer> & Pick<Signer, "id" | "name" | "role" | "phone" | "email" | "order">): Signer {
  return { status: "waiting", ...input };
}

const templateSeed = [
  {
    title: "قرارداد اجرای پروژه دیجیتال",
    slug: "digital-project-service",
    description: "مناسب طراحی سایت، محصول دیجیتال و خدمات فنی؛ با تحویل مرحله‌ای، پذیرش و مالکیت فکری.",
    category: "خدمات",
    signerRoles: ["مدیر پروژه", "کارفرما"],
    content: `قرارداد اجرای پروژه «[PROJECT_TITLE]»
شماره سند: [CONTRACT_NUMBER] | تاریخ تنظیم: [DATE]

این قرارداد میان مجری و آقای/خانم [USER_NAME] به نام شرکت [COMPANY]، با شناسه [NATIONAL_ID] و نشانی ایمیل [USER_EMAIL] منعقد شد.

۱. موضوع و شرح خدمات
مجری متعهد است خدمات تحلیل، طراحی، پیاده‌سازی و استقرار پروژه [PROJECT_TITLE] را مطابق جلسه شروع و مستندات تأییدشده انجام دهد. هر خدمت خارج از این شرح، برآورد و توافق جداگانه نیاز دارد.

۲. مدت و تحویل
شروع پروژه [START_DATE] و مهلت تحویل نسخه نهایی [DELIVERY_DAYS] است. تأخیر کارفرما در ارائه محتوا یا بازخورد، به همان میزان زمان تحویل را جابه‌جا می‌کند.

۳. مبلغ و تسویه
مبلغ توافق‌شده [AMOUNT] است. تسویه بر اساس مراحل تحویل انجام می‌شود و رسید سفارش [ORDER_ID] بخشی از این سند محسوب می‌شود.

۴. پذیرش و اصلاحات
کارفرما پنج روز کاری برای بررسی هر مرحله فرصت دارد. دو مرحله اصلاح متعارف در مبلغ قرارداد لحاظ شده است.

۵. مالکیت و محرمانگی
پس از تسویه کامل، حقوق بهره‌برداری خروجی اختصاصی به کارفرما منتقل می‌شود. اطلاعات فنی و تجاری طرفین محرمانه است.

۶. حل اختلاف
اختلافات ابتدا با مذاکره و سپس از طریق داوری توافقی حل می‌شود. نسخه دیجیتال، گزارش احراز هویت و ردپای امضا ضمیمه این قرارداد است.`,
  },
  {
    title: "قرارداد فروش و خدمات ووکامرس",
    slug: "woocommerce-sale-service",
    description: "صدور خودکار پس از سفارش؛ شامل مشخصات سفارش، ارسال، مرجوعی و پشتیبانی محصول.",
    category: "فروشگاه",
    signerRoles: ["کارشناس فروش", "مشتری"],
    content: `قرارداد فروش کالا و خدمات همراه
شماره قرارداد [CONTRACT_NUMBER] | شماره سفارش [ORDER_ID]

فروشنده و [USER_NAME] از مجموعه [COMPANY] در تاریخ [DATE] شرایط زیر را پذیرفتند.

۱. مشخصات معامله
موضوع سفارش «[PROJECT_TITLE]» و مبلغ نهایی آن [AMOUNT] است. جزئیات اقلام، مالیات و هزینه ارسال در فاکتور سفارش ثبت شده و با این قرارداد قابل استناد است.

۲. تحویل و ریسک انتقال
مهلت آماده‌سازی و تحویل [DELIVERY_DAYS] از تاریخ [START_DATE] است. آدرس مقصد همان نشانی ثبت‌شده در سفارش است و تغییر آن باید پیش از ارسال اعلام شود.

۳. ضمانت و پشتیبانی
اصالت و سلامت فیزیکی کالا تضمین می‌شود. خدمات آموزش و پشتیبانی صرفاً در بازه اعلام‌شده در صفحه محصول ارائه می‌شود.

۴. استرداد و مرجوعی
درخواست مرجوعی باید با شماره سفارش و مستندات نقص ثبت شود. کالای سفارشی‌سازی‌شده پس از ورود به مرحله تولید قابل مرجوعی نیست.

۵. تأیید الکترونیکی
مشتری با ثبت امضا پس از احراز هویت پیامکی، مطالعه شرایط و صحت اطلاعات سفارش را تأیید می‌کند. زمان، نشانی IP و مشخصات مرورگر در گواهی امضا درج می‌شود.`,
  },
  {
    title: "توافق‌نامه محرمانگی اطلاعات",
    slug: "mutual-confidentiality-nda",
    description: "NDA دوجانبه برای همکاری تجاری، دسترسی به داده، استثناها و مدت حفظ محرمانگی.",
    category: "حقوقی",
    signerRoles: ["نماینده حقوقی", "طرف دوم"],
    content: `توافق‌نامه حفظ محرمانگی اطلاعات
سند [CONTRACT_NUMBER] | تاریخ [DATE]

طرفین، از جمله [USER_NAME] به نمایندگی از [COMPANY] با شناسه [NATIONAL_ID]، برای بررسی همکاری در «[PROJECT_TITLE]» توافق می‌کنند.

۱. تعریف اطلاعات محرمانه
اسناد مالی، رمزهای دسترسی، داده مشتریان، کد منبع، طرح‌های محصول و هر اطلاعاتی که به‌صورت شفاهی یا مکتوب محرمانه اعلام شود مشمول این توافق است.

۲. تعهدات طرفین
اطلاعات فقط برای ارزیابی یا اجرای همکاری استفاده می‌شود. دسترسی محدود به افراد نیازمند آگاهی است و انتشار به شخص ثالث نیازمند رضایت کتبی است.

۳. استثناها
اطلاعات عمومی، اطلاعات دارای مجوز افشا و داده‌هایی که با حکم مرجع صالح درخواست شوند، در چارچوب قانون از شمول این تعهد خارج هستند.

۴. بازگرداندن و انهدام
پس از پایان همکاری یا درخواست مالک، نسخه‌های قابل بازگشت مسترد و نسخه‌های دیجیتال غیرضروری به‌صورت امن حذف می‌شوند.

۵. مدت و اختلاف
این توافق از [START_DATE] لازم‌الاجرا و تعهد محرمانگی تا سه سال پس از پایان همکاری معتبر است. امضای الکترونیکی طرفین نسخه واحد و قابل ردیابی ایجاد می‌کند.`,
  },
  {
    title: "قرارداد همکاری نمایندگی فروش",
    slug: "sales-representative",
    description: "تعریف حدود اختیارات نماینده، کارمزد، گزارش‌دهی، منع تضاد منافع و فسخ.",
    category: "نمایندگی",
    signerRoles: ["مدیر فروش", "مدیر مالی", "نماینده"],
    content: `قرارداد همکاری نمایندگی فروش
شماره [CONTRACT_NUMBER] | تاریخ [DATE]

این سند میان شرکت و [USER_NAME]، شناسه [NATIONAL_ID]، به‌عنوان نماینده مستقل در تاریخ [START_DATE] تنظیم شد.

۱. موضوع و قلمرو
نماینده معرفی و فروش «[PROJECT_TITLE]» را در منطقه توافق‌شده انجام می‌دهد. این قرارداد انحصار ایجاد نمی‌کند، مگر در سند الحاقی جداگانه.

۲. حدود اختیارات
نماینده حق دریافت وجه نقدی، تغییر قیمت اعلامی یا ارائه تعهد خارج از شرایط محصول را ندارد. سفارش پس از تأیید شرکت قطعی می‌شود.

۳. کارمزد و پرداخت
مبنای دوره جاری [AMOUNT] و جزئیات درصد کارمزد در الحاقیه مالی است. کارمزد سفارش‌های مرجوع‌شده پرداخت نمی‌شود و تسویه پس از اعلام گزارش انجام می‌گیرد.

۴. گزارش و حفظ داده
گزارش سفارش‌ها باید شفاف و قابل پیگیری باشد. استفاده از فهرست مشتریان برای فعالیت شخصی یا رقیب ممنوع است.

۵. مدت و فسخ
هر یک از طرفین می‌تواند با اعلام کتبی [DELIVERY_DAYS] پیش از پایان همکاری، قرارداد را فسخ کند. مطالبات سفارش‌های قطعی پیش از فسخ برقرار است.`,
  },
  {
    title: "تعهدنامه سطح خدمات پشتیبانی",
    slug: "support-service-level",
    description: "SLA برای سرویس‌های سازمانی با سطح اولویت، زمان پاسخ، نگهداری و گزارش رخداد.",
    category: "پشتیبانی",
    signerRoles: ["مسئول فنی", "نماینده کارفرما"],
    content: `تعهدنامه سطح خدمات پشتیبانی
شماره [CONTRACT_NUMBER] | خدمت [PROJECT_TITLE]

ارائه‌دهنده خدمت و [USER_NAME] از [COMPANY] در تاریخ [DATE] سطح خدمات زیر را توافق کردند.

۱. دامنه پشتیبانی
پایش سرویس، بررسی رخداد، رفع اشکال و پاسخ‌گویی فنی در ساعات اعلام‌شده انجام می‌شود. توسعه قابلیت جدید جزو پشتیبانی محسوب نمی‌شود.

۲. اولویت و زمان پاسخ
رخداد بحرانی با توقف کامل سرویس، حداکثر یک ساعت پاسخ اولیه دارد. رخداد عمده چهار ساعت و درخواست عادی یک روز کاری بررسی می‌شود. زمان پاسخ به معنای زمان رفع قطعی نیست.

۳. نگهداری برنامه‌ریزی‌شده
عملیات نگهداری حداقل ۴۸ ساعت پیش اطلاع‌رسانی می‌شود و تا حد امکان خارج از ساعات پرترافیک انجام می‌گیرد.

۴. مسئولیت کارفرما
ارائه دسترسی امن، ثبت اطلاعات رخداد و نگهداری نسخه پشتیبان از داده‌های عملیاتی بر عهده کارفرماست.

۵. بازه و هزینه
اعتبار از [START_DATE] برای [DELIVERY_DAYS] و هزینه دوره [AMOUNT] است. گزارش رخدادها و ساعات پاسخ‌گویی در پایان دوره ارائه می‌شود.`,
  },
];

export async function ensureSeed() {
  const existingSettings = await db.select({ id: settings.id }).from(settings).limit(1);
  if (!existingSettings.length) {
    await db.insert(settings).values({ id: 1, data: DEFAULT_SETTINGS });
  }

  const existingUsers = await db.select({ id: users.id }).from(users).limit(1);
  if (existingUsers.length) return;

  const insertedUsers = await db.insert(users).values([
    { name: "نگار محمدی", email: "negar.mohammadi@example.com", phone: "09121234567", nationalId: "0045879321", company: "استودیو روشن", role: "customer" },
    { name: "آرشام کیانی", email: "arsham.kiani@example.com", phone: "09135551234", nationalId: "0012387456", company: "بازارچه نوین", role: "customer" },
    { name: "سارا توکلی", email: "sara.tavakoli@example.com", phone: "09356664422", nationalId: "0064785210", company: "داده‌پرداز آبان", role: "customer" },
    { name: "ماهان صادقی", email: "mahan.sadeghi@example.com", phone: "09198887744", nationalId: "0098341276", company: "فروشگاه هفت", role: "customer" },
    { name: "لیلا رستگار", email: "leila.rastegar@example.com", phone: "09122347890", company: "امضاگیر", role: "legal" },
  ]).returning();

  const insertedTemplates = await db.insert(templates).values(templateSeed.map((item, index) => ({
    ...item,
    status: index === 4 ? "draft" : "active",
    version: index === 0 ? 3 : 1,
    createdAt: ago(60 - index * 7),
    updatedAt: ago(10 - index),
  }))).returning();

  const [negar, arsham, sara, mahan, leila] = insertedUsers;
  const [projectTpl, wooTpl, ndaTpl, agencyTpl] = insertedTemplates;
  const signedMeta = { ip: "185.143.232.41", userAgent: "Chrome 126 / macOS" };
  const common = (user: typeof negar, number: string) => ({
    USER_NAME: user.name,
    COMPANY: user.company || "—",
    NATIONAL_ID: user.nationalId || "—",
    USER_EMAIL: user.email,
    CONTRACT_NUMBER: number,
    DATE: new Intl.DateTimeFormat("fa-IR", { dateStyle: "long" }).format(new Date()),
    START_DATE: new Intl.DateTimeFormat("fa-IR", { dateStyle: "long" }).format(ahead(3)),
  });

  const rows = [
    {
      number: "EMZ-1405-1048", title: "قرارداد بازطراحی فروشگاه روشن", templateId: projectTpl.id, userId: negar.id, templateVersion: 3,
      content: projectTpl.content, variables: { ...common(negar, "EMZ-1405-1048"), PROJECT_TITLE: "بازطراحی فروشگاه اینترنتی روشن", AMOUNT: "۴۸۰٬۰۰۰٬۰۰۰ ریال", DELIVERY_DAYS: "۳۵ روز کاری", ORDER_ID: "WC-۸۴۲۱" },
      signers: [
        signer({ id: "pm-leila", name: leila.name, role: "مدیر پروژه", phone: leila.phone, email: leila.email, order: 1, status: "signed", signedAt: ago(3, 4).toISOString(), signatureData: drawnSignature(0), signatureMethod: "draw", ...signedMeta }),
        signer({ id: negar.id, name: negar.name, role: "کارفرما", phone: negar.phone, email: negar.email, order: 2, status: "signed", signedAt: ago(2, 7).toISOString(), signatureData: drawnSignature(1), signatureMethod: "draw", ip: "5.112.84.20", userAgent: "Safari / iPhone" }),
      ], currentSigner: 2, status: "signed", verificationHash: createHash("sha256").update("EMZ-1405-1048").digest("hex"), source: "woocommerce", issuedAt: ago(5), signedAt: ago(2, 7), expiresAt: ahead(2),
    },
    {
      number: "EMZ-1405-1051", title: "قرارداد توسعه پرتال مشتریان نوین", templateId: projectTpl.id, userId: arsham.id, templateVersion: 3,
      content: projectTpl.content, variables: { ...common(arsham, "EMZ-1405-1051"), PROJECT_TITLE: "توسعه پرتال مشتریان نوین", AMOUNT: "۷۲۰٬۰۰۰٬۰۰۰ ریال", DELIVERY_DAYS: "۴۵ روز کاری", ORDER_ID: "WC-۸۵۱۹" },
      signers: [signer({ id: arsham.id, name: arsham.name, role: "کارفرما", phone: arsham.phone, email: arsham.email, order: 1, status: "active" })],
      currentSigner: 0, status: "pending", source: "manual", issuedAt: ago(1, 3), expiresAt: ahead(6),
    },
    {
      number: "EMZ-1405-1049", title: "توافق‌نامه محرمانگی داده‌پرداز آبان", templateId: ndaTpl.id, userId: sara.id, templateVersion: 1,
      content: ndaTpl.content, variables: { ...common(sara, "EMZ-1405-1049"), PROJECT_TITLE: "اتصال زیرساخت داده و تحلیل فروش", AMOUNT: "—", DELIVERY_DAYS: "—", ORDER_ID: "—" },
      signers: [
        signer({ id: leila.id, name: leila.name, role: "نماینده حقوقی", phone: leila.phone, email: leila.email, order: 1, status: "signed", signedAt: ago(1, 8).toISOString(), signatureData: drawnSignature(2), signatureMethod: "upload", ...signedMeta }),
        signer({ id: sara.id, name: sara.name, role: "طرف دوم", phone: sara.phone, email: sara.email, order: 2, status: "active" }),
      ], currentSigner: 1, status: "pending", source: "manual", issuedAt: ago(2), expiresAt: ahead(5),
    },
    {
      number: "EMZ-1405-1044", title: "نمایندگی فروش منطقه مرکزی", templateId: agencyTpl.id, userId: mahan.id, templateVersion: 1,
      content: agencyTpl.content, variables: { ...common(mahan, "EMZ-1405-1044"), PROJECT_TITLE: "اشتراک سازمانی امضاگیر", AMOUNT: "کارمزد ۱۲٪ فروش قطعی", DELIVERY_DAYS: "۱۴ روز", ORDER_ID: "—" },
      signers: [
        signer({ id: "sales-admin", name: "پیمان احمدی", role: "مدیر فروش", phone: "09120000001", email: "sales@example.com", order: 1, status: "signed", signedAt: ago(12).toISOString(), signatureData: drawnSignature(0), signatureMethod: "draw", ...signedMeta }),
        signer({ id: "finance-admin", name: "مریم فراهانی", role: "مدیر مالی", phone: "09120000002", email: "finance@example.com", order: 2, status: "signed", signedAt: ago(11).toISOString(), signatureData: drawnSignature(2), signatureMethod: "draw", ...signedMeta }),
        signer({ id: mahan.id, name: mahan.name, role: "نماینده", phone: mahan.phone, email: mahan.email, order: 3, status: "signed", signedAt: ago(10).toISOString(), signatureData: drawnSignature(1), signatureMethod: "draw", ip: "78.39.110.9", userAgent: "Chrome / Android" }),
      ], currentSigner: 3, status: "signed", verificationHash: createHash("sha256").update("EMZ-1405-1044").digest("hex"), source: "manual", issuedAt: ago(14), signedAt: ago(10), expiresAt: ago(7),
    },
    {
      number: "EMZ-1405-1037", title: "سفارش اشتراک سازمانی هفت", templateId: wooTpl.id, userId: mahan.id, templateVersion: 1,
      content: wooTpl.content, variables: { ...common(mahan, "EMZ-1405-1037"), PROJECT_TITLE: "اشتراک سازمانی، ۱۰ کاربر", AMOUNT: "۹۶٬۰۰۰٬۰۰۰ ریال", DELIVERY_DAYS: "۲ روز کاری", ORDER_ID: "WC-۸۳۲۰" },
      signers: [signer({ id: mahan.id, name: mahan.name, role: "مشتری", phone: mahan.phone, email: mahan.email, order: 1, status: "active" })],
      currentSigner: 0, status: "pending", source: "woocommerce", issuedAt: ago(4), expiresAt: ahead(3),
    },
    {
      number: "EMZ-1405-1019", title: "پروژه منقضی‌شده باشگاه مشتریان", templateId: projectTpl.id, userId: sara.id, templateVersion: 2,
      content: projectTpl.content, variables: { ...common(sara, "EMZ-1405-1019"), PROJECT_TITLE: "طراحی باشگاه مشتریان", AMOUNT: "۲۱۰٬۰۰۰٬۰۰۰ ریال", DELIVERY_DAYS: "۲۰ روز کاری", ORDER_ID: "WC-۸۰۱۴" },
      signers: [signer({ id: sara.id, name: sara.name, role: "کارفرما", phone: sara.phone, email: sara.email, order: 1, status: "waiting" })],
      currentSigner: 0, status: "expired", source: "woocommerce", issuedAt: ago(18), expiresAt: ago(11),
    },
  ];

  const insertedContracts = await db.insert(contracts).values(rows).returning();
  await db.insert(auditEvents).values([
    { contractId: insertedContracts[0].id, actor: "سیستم ووکامرس", action: "issued", description: "قرارداد پس از پرداخت سفارش WC-۸۴۲۱ صادر شد.", ip: "10.0.0.12", metadata: { source: "woocommerce", orderId: "8421" }, createdAt: ago(5) },
    { contractId: insertedContracts[0].id, actor: leila.name, action: "signed", description: "امضای مدیر پروژه با احراز هویت پیامکی ثبت شد.", ip: signedMeta.ip, userAgent: signedMeta.userAgent, metadata: { signerOrder: 1 }, createdAt: ago(3, 4) },
    { contractId: insertedContracts[0].id, actor: negar.name, action: "signed", description: "کارفرما امضا کرد و نسخه نهایی سند ساخته شد.", ip: "5.112.84.20", userAgent: "Safari / iPhone", metadata: { signerOrder: 2, hash: "SHA-256" }, createdAt: ago(2, 7) },
    { contractId: insertedContracts[0].id, actor: "سیستم", action: "pdf", description: "سند PDF نهایی با اثر انگشت SHA-256 ثبت شد.", metadata: { size: "۲۸۴ کیلوبایت" }, createdAt: ago(2, 6) },
    { contractId: insertedContracts[1].id, actor: "مدیر امضاگیر", action: "issued", description: "قرارداد پروژه برای آرشام کیانی صادر شد.", ip: "10.0.0.12", metadata: { channel: "admin" }, createdAt: ago(1, 3) },
    { contractId: insertedContracts[1].id, actor: "درگاه آزمایشی", action: "notification", description: "پیام صدور در محیط آزمایشی ثبت شد؛ پیامک واقعی ارسال نشد.", metadata: { provider: "demo" }, createdAt: ago(1, 2) },
    { contractId: insertedContracts[2].id, actor: "مدیر امضاگیر", action: "issued", description: "گردش‌کار دومرحله‌ای NDA آغاز شد.", ip: "10.0.0.12", createdAt: ago(2) },
    { contractId: insertedContracts[2].id, actor: leila.name, action: "signed", description: "امضای آپلودشده نماینده حقوقی پذیرفته شد.", ip: signedMeta.ip, userAgent: signedMeta.userAgent, metadata: { method: "upload" }, createdAt: ago(1, 8) },
    { contractId: insertedContracts[3].id, actor: "مریم فراهانی", action: "signed", description: "تأیید مالی ثبت و نوبت امضا به نماینده منتقل شد.", ip: "185.143.232.41", metadata: { signerOrder: 2 }, createdAt: ago(11) },
    { contractId: insertedContracts[4].id, actor: "سیستم ووکامرس", action: "issued", description: "نگاشت محصول به قالب فروش، قرارداد را خودکار صادر کرد.", metadata: { source: "woocommerce" }, createdAt: ago(4) },
    { contractId: insertedContracts[5].id, actor: "زمان‌بند", action: "expired", description: "مهلت امضای قرارداد به پایان رسید و لینک امضا بسته شد.", metadata: { automatic: true }, createdAt: ago(11) },
    { actor: "مدیر سیستم", action: "settings", description: "مهلت اعتبار کد یکبارمصرف روی ۱۲۰ ثانیه تنظیم شد.", ip: "10.0.0.12", metadata: { otpExpirySeconds: 120 }, createdAt: ago(8) },
  ]);
}
