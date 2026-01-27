"use client";

import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@/components/FaIcon";
import { faArrowUp } from "@fortawesome/free-solid-svg-icons";
import { Button } from "@/components/ui/button";

export function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      // 300px 이상 스크롤 시 버튼 표시
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);

    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  if (!isVisible) return null;

  return (
    <Button
      onClick={scrollToTop}
      className={`fixed bottom-8 right-8 z-50 w-12 h-12 rounded-full shadow-lg transition-all duration-300 transform hover:scale-110 ${
        isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
      }`}
      style={{
        background: "rgba(255, 255, 255, 0.8)",
        backdropFilter: "blur(8px)",
        border: "1px solid rgba(0,0,0,0.05)",
        color: "#1e293b"
      }}
      size="icon"
      aria-label="Scroll to top"
    >
      <FontAwesomeIcon icon={faArrowUp} className="w-5 h-5" />
    </Button>
  );
}
