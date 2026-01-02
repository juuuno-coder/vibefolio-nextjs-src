// src/app/layout.tsx

import type { Metadata } from "next";
import { TopHeader } from "@/components/TopHeader";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AutoLogoutProvider } from "@/components/AutoLogoutProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "바이브폴리오 | AI 창작자를 위한 포트폴리오 플랫폼",
  description: "바이브코더, AI 창작물을 등록하고 공유하는 포트폴리오 플랫폼",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white min-h-screen`}
      >
        <AutoLogoutProvider>
          <TooltipProvider>
            <TopHeader />
            <Header />
            <div className="min-h-screen fade-in">
              {children}
            </div>
            <Footer />
          </TooltipProvider>
        </AutoLogoutProvider>
      </body>
    </html>
  );
}
