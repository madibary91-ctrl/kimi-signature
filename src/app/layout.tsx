import type { Metadata } from "next";
import "@fontsource/vazirmatn/400.css";
import "@fontsource/vazirmatn/500.css";
import "@fontsource/vazirmatn/600.css";
import "@fontsource/vazirmatn/700.css";
import "@fontsource/vazirmatn/800.css";
import "@fontsource/vazirmatn/900.css";
import "./globals.css";
import { MotionProvider } from "@/components/MotionProvider";

export const metadata: Metadata = {
  title: "امضاگیر | میزکار قرارداد و امضای دیجیتال",
  description: "معماری ماژولار و میزکار کامل قالب، صدور، احراز هویت و امضای قرارداد برای وردپرس و ووکامرس.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fa" dir="rtl">
      <body><MotionProvider>{children}</MotionProvider></body>
    </html>
  );
}
