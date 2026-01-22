// src/components/Logo.tsx
import React from "react";
import Image from "next/image";

interface LogoProps {
  className?: string;
  textClassName?: string;
  showText?: boolean;
}

export const VibeLogo = ({ className = "h-8", showText = true }: LogoProps) => {
  // 고유한 ID를 사용하여 그라디언트 충돌 방지
  const gradientId = "vibe_logo_gradient_auth";
  
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Image
        src="/vibefolio6.png"
        alt="Vibefolio Logo"
        width={120}
        height={32}
        className="h-full w-auto object-contain"
        priority
      />
    </div>
  );
};
