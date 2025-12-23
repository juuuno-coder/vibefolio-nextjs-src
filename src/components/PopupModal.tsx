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
import { X } from "lucide-react";
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

  useEffect(() => {
    loadPopup();
  }, []);

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
        // 쿠키 확인: 오늘 하루 보지 않기
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

  if (!popup) return null;

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
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-slate-900 mb-4">
              {popup.title}
            </DialogTitle>
          </DialogHeader>

          {popup.content && (
            <p className="text-slate-600 leading-relaxed mb-6 whitespace-pre-wrap">
              {popup.content}
            </p>
          )}

          <DialogFooter className="flex-col sm:flex-col gap-3">
            {popup.link_url && (
              <Link href={popup.link_url} className="w-full" onClick={handleClose}>
                <Button className="w-full h-12 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold rounded-xl shadow-lg">
                  {popup.link_text}
                </Button>
              </Link>
            )}
            <div className="flex gap-2 w-full">
              <Button
                variant="outline"
                onClick={handleHideToday}
                className="flex-1 h-11 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                오늘 하루 보지 않기
              </Button>
              <Button
                variant="ghost"
                onClick={handleClose}
                className="flex-1 h-11 rounded-xl text-slate-500 hover:bg-slate-50"
              >
                닫기
              </Button>
            </div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
