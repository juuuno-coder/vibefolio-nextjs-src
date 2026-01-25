import type { Metadata } from "next";
import Script from "next/script";
import { Poppins, Noto_Sans_KR } from "next/font/google";
import "./globals.css";
import { ClientProviders } from "@/components/ClientProviders";
import { ScrollToTop } from "@/components/ScrollToTop";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AutoLogoutProvider } from "@/components/AutoLogoutProvider";
import NextTopLoader from 'nextjs-toploader';
import { RootLayoutContent } from "@/components/layout/RootLayoutContent";
import RealtimeListener from "@/components/RealtimeListener";
import { VisitTracker } from "@/components/VisitTracker";
import { headers } from "next/headers";

export const revalidate = 300; // 5분마다 갱신 (성능 최적화)

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

import { createClient } from '@supabase/supabase-js';

export async function generateMetadata(): Promise<Metadata> {
  const defaultTitle = "Vibefolio - 크리에이터를 위한 영감 저장소";
  const defaultDesc = "디자이너, 개발자, 기획자를 위한 프로젝트 아카이빙 및 레퍼런스 공유 플랫폼";
  const defaultOgImage = "/images/og-default.png"; // Fallback if needed

  let title = defaultTitle;
  let description = defaultDesc;
  let ogImage = "";
  let favicon = "/vibefolio2.png"; // Default Favicon

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.warn('[Layout] Missing Supabase environment variables. using default metadata.');
    } else {
      const supabase = createClient(supabaseUrl, supabaseKey);
      // site_config 테이블이 없을 수 있으므로 에러 핸들링
      const { data, error } = await supabase.from('site_config').select('*');
      
      if (error) {
        console.error('[Layout] site_config fetch error (ignoring):', error.message);
      } else if (data) {
        const config: any = {};
        data.forEach((item: any) => config[item.key] = item.value);
        
        if (config.seo_title) title = config.seo_title;
        if (config.seo_description) description = config.seo_description;
        if (config.seo_og_image) ogImage = config.seo_og_image;
        if (config.seo_favicon) favicon = config.seo_favicon;
      }
    }
  } catch (e) {
    console.error('Metadata fetch critical failure:', e);
  }

  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://vibefolio.net'),
    title: title,
    description: description,
    keywords: ["AI", "포트폴리오", "바이브코딩", "창작물", "디자인", "일러스트", "3D"],
    openGraph: {
      title: title,
      description: description,
      type: "website",
      images: ogImage ? [{ url: ogImage }] : [],
    },
    icons: {
      icon: favicon,
      shortcut: favicon,
      apple: favicon,
    },
  };
}

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
        {/* Naver Search Advisor */}
        {process.env.NEXT_PUBLIC_NAVER_SITE_VERIFICATION && (
          <meta name="naver-site-verification" content={process.env.NEXT_PUBLIC_NAVER_SITE_VERIFICATION} />
        )}
      </head>
      <body
        className={`${poppins.variable} ${notoSansKr.variable} font-sans antialiased bg-white min-h-screen custom-scrollbar overscroll-none`}
      >
        <Script
          src="https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js"
          integrity="sha384-TiCUE00h649CAMonG018J2ujOgDKW/kVWlChEuu4jK2txfLEH92VRGWkpM1PZ+j"
          crossOrigin="anonymous"
          strategy="lazyOnload"
        />
        {/* Google Analytics (GA4) */}
        {process.env.NEXT_PUBLIC_GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');
              `}
            </Script>
          </>
        )}
        <VisitTracker />
        <NextTopLoader color="#000000" showSpinner={false} />
        <ClientProviders>
          <AutoLogoutProvider>
            <TooltipProvider>
              <RealtimeListener />
              <RootLayoutContent isReviewServer={headers().get('host')?.includes('review')}>
                {children}
              </RootLayoutContent>
              <Toaster position="top-center" />
              <ScrollToTop />
            </TooltipProvider>
          </AutoLogoutProvider>
        </ClientProviders>
      </body>
    </html>
  );
}
