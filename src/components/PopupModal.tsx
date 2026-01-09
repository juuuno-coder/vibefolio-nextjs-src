"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";

interface Popup {
  id: number;
  title: string;
  content: string;
  image_url: string | null;
  is_important: boolean;
  is_visible: boolean;
  link_url: string | null;
  link_text: string | null;
}

export function PopupModal() {
  const [popup, setPopup] = useState<Popup | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // 클라이언트 마운트 상태 추적 (하이드레이션 안전)
  useEffect(() => {
    setMounted(true);
  }, []);

  // 팝업 로드 - mounted 상태에서만 실행
  useEffect(() => {
    if (!mounted) return;
    loadPopup();
  }, [mounted]);

  const loadPopup = async () => {
    try {
      // notices 테이블에서 팝업으로 설정된 최신 공지사항 가져오기
      const { data, error } = await (supabase
        .from("notices") as any)
        .select("*")
        .eq("is_popup", true)
        .eq("is_visible", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error) {
        // 데이터가 없으면 에러가 발생하므로 무시
        return;
      }

      if (data) {
        // localStorage 확인: 오늘 하루 보지 않기
        const hideUntil = localStorage.getItem(`popup_hide_${data.id}`);
        if (hideUntil) {
          const hideDate = new Date(hideUntil);
          if (hideDate > new Date()) {
            return; // 아직 숨김 기간
          }
        }

        setPopup(data as Popup);
        setIsOpen(true);
      }
    } catch (err) {
      console.error("Popup load error:", err);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleHideToday = () => {
    if (popup) {
      // 오늘 자정까지 숨기기
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      localStorage.setItem(`popup_hide_${popup.id}`, tomorrow.toISOString());
    }
    setIsOpen(false);
  };

  // 마운트되지 않았거나 팝업이 없으면 렌더링하지 않음
  if (!mounted || !popup) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-lg bg-white rounded-3xl p-0 overflow-hidden">
        {/* Image */}
        {popup.image_url && (
          <div className="relative w-full h-64 bg-gradient-to-br from-purple-100 to-blue-100">
            <Image
              src={popup.image_url}
              alt={popup.title}
              fill
              className="object-cover"
            />
          </div>
        )}

        {/* Content */}
        <div className="p-8">
          <DialogHeader className="mb-8 text-left">
            <div className="flex items-center gap-2 mb-3">
              <div className="px-2 py-0.5 bg-green-100 text-[#16A34A] text-[10px] font-black uppercase tracking-widest rounded-md">
                NOTICE
              </div>
              {popup.is_important && (
                <div className="px-2 py-0.5 bg-red-100 text-red-600 text-[10px] font-black uppercase tracking-widest rounded-md">
                  URGENT
                </div>
              )}
            </div>
            <DialogTitle className="text-2xl md:text-3xl font-black text-slate-900 leading-[1.2] tracking-tight">
              {popup.title}
            </DialogTitle>
            <DialogDescription className="text-slate-600 font-medium leading-relaxed mt-4 line-clamp-6 text-base">
              {popup.content}
            </DialogDescription>
          </DialogHeader>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            {popup.link_url && (
              <Button 
                className="w-full h-14 bg-slate-900 hover:bg-[#16A34A] text-white rounded-2xl font-black transition-all duration-300 shadow-xl shadow-slate-200"
                onClick={() => window.open(popup.link_url as string, "_blank")}
              >
                {popup.link_text || "자세히 보기"}
              </Button>
            )}
            
            <div className="flex items-center justify-between mt-2 px-1">
              <button
                onClick={handleHideToday}
                className="text-[11px] font-bold text-slate-400 hover:text-[#16A34A] transition-colors flex items-center gap-2 group"
              >
                <div className="w-4 h-4 rounded border border-slate-200 flex items-center justify-center group-hover:border-[#16A34A] transition-colors">
                  <div className="w-2 h-2 rounded-sm bg-transparent group-hover:bg-[#16A34A]/30 transition-colors" />
                </div>
                오늘 하루 보지 않기
              </button>
              
              <button
                onClick={handleClose}
                className="text-[11px] font-black text-slate-300 hover:text-slate-900 uppercase tracking-widest transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
