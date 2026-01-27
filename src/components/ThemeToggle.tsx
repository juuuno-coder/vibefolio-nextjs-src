"use client";

import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@/components/FaIcon";
import { faMoon, faSun } from "@fortawesome/free-solid-svg-icons";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    setMounted(true);
    // localStorage에서 테마 로드
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    
    if (savedTheme) {
      setTheme(savedTheme);
      if (savedTheme === "dark") {
        document.documentElement.classList.add("dark");
      }
    } else if (systemDark) {
      setTheme("dark");
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  // 마운트 전에는 아무것도 렌더링하지 않음 (하이드레이션 불일치 방지)
  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="w-9 h-9 rounded-full hover:bg-gray-100"
        aria-label="테마 전환"
      >
        <FontAwesomeIcon icon={faMoon} className="w-5 h-5 text-gray-600" />
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="w-9 h-9 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
      aria-label={theme === "dark" ? "라이트 모드로 전환" : "다크 모드로 전환"}
    >
      {theme === "dark" ? (
        <FontAwesomeIcon icon={faSun} className="w-5 h-5 text-yellow-500" />
      ) : (
        <FontAwesomeIcon icon={faMoon} className="w-5 h-5 text-gray-600" />
      )}
    </Button>
  );
}
