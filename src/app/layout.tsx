import type { Metadata } from "next";
import { Poppins, Noto_Sans_KR } from "next/font/google";
import "./globals.css";
import { ClientProviders } from "@/components/ClientProviders";
import { ScrollToTop } from "@/components/ScrollToTop";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AutoLogoutProvider } from "@/components/AutoLogoutProvider";
import NextTopLoader from 'nextjs-toploader';
import { RootLayoutContent } from "@/components/layout/RootLayoutContent";

const poppins = Poppins({
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
              <RootLayoutContent>{children}</RootLayoutContent>
              <Toaster position="top-center" />
              <ScrollToTop />
            </TooltipProvider>
          </AutoLogoutProvider>
        </ClientProviders>
      </body>
    </html>
  );
}
