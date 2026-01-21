"use client";

import { usePathname } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Suspense } from "react";

export function RootLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminPage = pathname?.startsWith('/admin');
  const isReviewPage = pathname?.startsWith('/review');
  const hideLayout = isAdminPage || isReviewPage;

  return (
    <div className="flex min-h-screen flex-col relative w-full overflow-x-hidden">
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
