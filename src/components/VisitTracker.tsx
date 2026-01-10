"use client";

import { useEffect } from "react";

export function VisitTracker() {
  useEffect(() => {
    // 세션 스토리지 체크: 현재 브라우저 세션에서 이미 방문했는지 확인
    const hasVisited = sessionStorage.getItem("vibefolio_session_visit");
    
    if (!hasVisited) {
       // 방문 기록 API 호출
       fetch("/api/visit", { method: "POST" })
         .then(res => {
            if (res.ok) {
                // 호출 성공 시 플래그 설정
                sessionStorage.setItem("vibefolio_session_visit", "true");
            }
         })
         .catch(err => console.error("Visit tracking failed:", err));
    }
  }, []);

  return null; // UI를 렌더링하지 않음
}
