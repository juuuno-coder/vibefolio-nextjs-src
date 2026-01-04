"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes

export function AutoLogoutProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const inactivityTimer = useRef<NodeJS.Timeout>();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    localStorage.clear();
    router.push("/login");
    alert("30분 동안 활동이 없어 자동 로그아웃되었습니다.");
  };

  const resetTimer = () => {
    if (inactivityTimer.current) {
      clearTimeout(inactivityTimer.current);
    }
    inactivityTimer.current = setTimeout(handleSignOut, INACTIVITY_TIMEOUT);
  };

  useEffect(() => {
    const events = ["mousemove", "keydown", "click", "scroll"];

    const eventListener = () => {
      resetTimer();
    };

    events.forEach((event) => {
      window.addEventListener(event, eventListener);
    });

    resetTimer();

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, eventListener);
      });
      if (inactivityTimer.current) {
        clearTimeout(inactivityTimer.current);
      }
    };
  }, []);

  return <>{children}</>;
}
