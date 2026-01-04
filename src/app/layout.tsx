import { Suspense } from "react";
import type { Metadata } from "next";
import { TopHeader } from "@/components/TopHeader";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Geist, Geist_Mono, Noto_Sans_KR } from "next/font/google";
import "./globals.css";
import { ClientProviders } from "@/components/ClientProviders";
import { ScrollToTop } from "@/components/ScrollToTop";
import { Toaster } from "@/components/ui/sonner";
import NextTopLoader from 'nextjs-toploader';
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

const notoSansKr = Noto_Sans_KR({
  weight: ["100", "300", "400", "500", "700", "900"],
  subsets: ["latin"],
  variable: "--font-noto-sans-kr",
});

export const metadata: Metadata = {
  title: "바이브폴리오 | AI 창작자를 위한 포트폴리오 플랫폼",
  description: "바이브코더, AI 창작물을 등록하고 공유하는 포트폴리오 플랫폼",
  keywords: ["AI", "포트폴리오", "바이브코딩", "창작물", "디자인", "일러스트", "3D"],
  openGraph: {
    title: "바이브폴리오 | AI 창작자를 위한 포트폴리오 플랫폼",
    description: "바이브코더, AI 창작물을 등록하고 공유하는 포트폴리오 플랫폼",
    type: "website",
    locale: "ko_KR",
  },
  twitter: {
    card: "summary_large_image",
    title: "바이브폴리오 | AI 창작자를 위한 포트폴리오 플랫폼",
    description: "바이브코더, AI 창작물을 등록하고 공유하는 포트폴리오 플랫폼",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${notoSansKr.variable} font-sans antialiased bg-white min-h-screen custom-scrollbar overscroll-none`}
      >
        <ClientProviders>
          <AutoLogoutProvider>
            <TooltipProvider>
              <NextTopLoader 
                color="#16A34A"
                initialPosition={0.08}
                crawlSpeed={200}
                height={3}
                crawl={true}
                showSpinner={false}
                easing="ease"
                speed={200}
                shadow="0 0 10px #16A34A,0 0 5px #16A34A"
              />
              {/* TopHeader - 최상단 배너 */}
              <TopHeader />
              
              {/* Header 컴포넌트 - Suspense로 감싸서 useSearchParams 에러 방지 */}
              <Suspense fallback={<div className="h-16 bg-white" />}>
                <Header />
              </Suspense>

              {/* 메인 콘텐츠 영역 */}
              <div className="min-h-screen fade-in">
                {children}
              </div>

              {/* Footer 컴포넌트 */}
              <Footer />
              <ScrollToTop />
              <Toaster />
            </TooltipProvider>
          </AutoLogoutProvider>
        </ClientProviders>
      </body>
    </html>
  );
}
