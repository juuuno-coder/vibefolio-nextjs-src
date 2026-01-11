"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function VisitTracker() {
  const pathname = usePathname();

  useEffect(() => {
    const hasVisited = sessionStorage.getItem("vibefolio_session_visit_v1");
    
    if (!hasVisited) {
       // 방문 기록 및 상세 정보 전송
       fetch("/api/visit", { 
         method: "POST",
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
           path: pathname,
           referrer: document.referrer || ''
         })
       })
         .then(res => {
            if (res.ok) {
                sessionStorage.setItem("vibefolio_session_visit_v1", "true");
            }
         })
         .catch(err => console.error("Visit tracking failed:", err));
    }
  }, [pathname]);

  return null;
}
