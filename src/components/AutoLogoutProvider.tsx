"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";

const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes

export function AutoLogoutProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const inactivityTimer = useRef<NodeJS.Timeout>();

  const handleSignOut = async () => {
    // Only sign out if we have a session
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      await supabase.auth.signOut();
      toast("30분 동안 활동이 없어 자동 로그아웃되었습니다.");
      router.push("/login");
    }
  };

  const resetTimer = () => {
    if (inactivityTimer.current) {
      clearTimeout(inactivityTimer.current);
    }
    inactivityTimer.current = setTimeout(handleSignOut, INACTIVITY_TIMEOUT);
  };

  useEffect(() => {
    // Only set up listeners if we are logged in (or we can check periodically)
    // However, for simplicity, we run it always, and check session on timeout.

    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];

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
