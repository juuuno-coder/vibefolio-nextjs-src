import { Suspense } from "react";
import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Poppins, Noto_Sans_KR } from "next/font/google"; // Poppins
import "./globals.css";
import { ClientProviders } from "@/components/ClientProviders";
import { ScrollToTop } from "@/components/ScrollToTop";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AutoLogoutProvider } from "@/components/AutoLogoutProvider";
import NextTopLoader from 'nextjs-toploader';

const poppins = Poppins({ // Poppins
  weight: ['400', '500', '600', '700', '800'],
  subsets: ['latin'],
  variable: "--font-poppins",
});

const notoSansKr = Noto_Sans_KR({
  weight: ['400', '500', '700'],
  subsets: ['latin'],
  variable: '--font-noto-sans-kr',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://vibefolio.net'),
  title: "Vibefolio - 크리에이터를 위한 영감 저장소",
  description: "디자이너, 개발자, 기획자를 위한 프로젝트 아카이빙 및 레퍼런스 공유 플랫폼",
  keywords: ["AI", "포트폴리오", "바이브코딩", "창작물", "디자인", "일러스트", "3D"],
  openGraph: {
    title: "Vibefolio",
    description: "영감을 수집하고 공유하세요",
    // images: ["/og-image.png"], // TODO: 실제 이미지 파일 추가 필요
    type: "website",
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        {/* Preconnect to image domains for faster loading */}
        <link rel="preconnect" href="https://images.unsplash.com" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
        <link rel="preconnect" href="https://vibefolio.com" />
        <link rel="dns-prefetch" href="https://vibefolio.com" />
      </head>
      <body
        className={`${poppins.variable} ${notoSansKr.variable} font-sans antialiased bg-white min-h-screen custom-scrollbar overscroll-none`}
      >
        <NextTopLoader color="#000000" showSpinner={false} />
        <ClientProviders>
          <AutoLogoutProvider>
            <TooltipProvider>
              <div className="flex min-h-screen flex-col relative w-full overflow-x-hidden">
                <Header />
                <main className="flex-1 w-full max-w-[1920px] mx-auto pt-[60px] pb-20 fade-in">
                  <Suspense fallback={null}>
                    {children}
                  </Suspense>
                </main>
                <Footer />
              </div>
              <Toaster position="top-center" />
              <ScrollToTop />
            </TooltipProvider>
          </AutoLogoutProvider>
        </ClientProviders>
      </body>
    </html>
  );
}
