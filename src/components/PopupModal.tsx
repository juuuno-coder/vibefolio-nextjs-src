"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";

interface Popup {
  id: number;
  title: string;
  content: string | null;
  image_url: string | null;
  link_url: string | null;
  link_text: string;
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
      // 활성화되고 기간 내인 팝업 중 첫 번째 가져오기
      const { data, error } = await (supabase
        .from("popups") as any)
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true })
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
        <div className="p-7">
          <DialogHeader className="mb-6 text-left">
            <div className="text-sm font-semibold text-blue-600 mb-2">🎉 NOTICE</div>
            <DialogTitle className="text-2xl font-bold text-gray-900 leading-tight">
              {popup.title}
            </DialogTitle>
          </DialogHeader>

          {popup.content && (
            <p className="text-gray-600 leading-relaxed mb-8 whitespace-pre-wrap text-[15px]">
              {popup.content}
            </p>
          )}

          <DialogFooter className="flex-col sm:flex-col gap-3">
            {popup.link_url && (
              <Button asChild className="w-full h-12 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white font-bold rounded-xl shadow-lg shadow-blue-100 transition-all hover:scale-[1.02] text-base">
                <Link href={popup.link_url} onClick={handleClose}>
                  {popup.link_text || '자세히 보기'}
                </Link>
              </Button>
            )}
            
            <div className="flex items-center justify-between w-full mt-2 px-1">
              <button
                onClick={handleHideToday}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors py-2"
              >
                다시 보지 않기
              </button>
              <button
                onClick={handleClose}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors py-2 px-2"
              >
                닫기
              </button>
            </div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
