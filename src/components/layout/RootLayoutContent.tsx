"use client";

import { usePathname } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Suspense } from "react";

export function RootLayoutContent({ 
  children,
  isReviewServer = false
}: { 
  children: React.ReactNode;
  isReviewServer?: boolean;
}) {
  const pathname = usePathname();
  const isAdminPage = pathname?.startsWith('/admin');
  const isReviewPath = pathname?.includes('review');
  const isReviewSubdomain = typeof window !== 'undefined' && (window.location.hostname.includes('review') || window.location.host.includes('review'));
  const hideLayout = isAdminPage || isReviewPath || isReviewSubdomain || isReviewServer;

  return (
    <div className="flex min-h-screen flex-col relative w-full">
      {!hideLayout && <Header />}
      <main className={`flex-1 w-full max-w-[1920px] mx-auto ${hideLayout ? "" : "pt-[60px] pb-20"} fade-in`}>
        <Suspense fallback={null}>
          {children}
        </Suspense>
      </main>
      {!hideLayout && <Footer />}
    </div>
  );
}
