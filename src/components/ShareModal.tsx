"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FontAwesomeIcon } from "./FaIcon";
import { faCopy, faCheck, faLink } from "@fortawesome/free-solid-svg-icons";
import { faComment } from "@fortawesome/free-solid-svg-icons";
import { faXTwitter, faThreads } from "@fortawesome/free-brands-svg-icons";

declare global {
  interface Window {
    Kakao: any;
  }
}

interface ShareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  url: string;
  title: string;
  description?: string;
  imageUrl?: string;
}

export function ShareModal({
  open,
  onOpenChange,
  url,
  title,
  description = "",
  imageUrl = "",
}: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [supportsNativeShare, setSupportsNativeShare] = useState(false);

  useEffect(() => {
    // 클라이언트 사이드에서만 네이티브 공유 지원 확인
    setSupportsNativeShare(typeof navigator !== "undefined" && !!navigator.share);
  }, []);

  useEffect(() => {
    // 모달 열릴 때 카카오 SDK 초기화 미리 시도
    if (open && typeof window !== "undefined" && window.Kakao) {
      if (!window.Kakao.isInitialized() && process.env.NEXT_PUBLIC_KAKAO_API_KEY) {
        try {
          window.Kakao.init(process.env.NEXT_PUBLIC_KAKAO_API_KEY);
        } catch (e) {
          console.error("Kakao init error:", e);
        }
      }
    }
  }, [open]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("클립보드 복사 실패:", error);
    }
  };



  // HTML 태그 제거 함수
  const stripHtml = (html: string) => {
    if (!html) return "";
    return html.replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ').trim();
  };

  const cleanTitle = stripHtml(title);
  const cleanDescription = stripHtml(description);

  // 카카오톡 공유 (SDK 사용 + Fallback)
  const shareKakao = () => {
    // 1. SDK가 정상적으로 로드되었는지 확인
    if (typeof window !== "undefined" && window.Kakao && window.Kakao.isInitialized()) {
      window.Kakao.Share.sendDefault({
        objectType: 'feed',
        content: {
          title: cleanTitle,
          description: cleanDescription,
          imageUrl: imageUrl || 'https://vibefolio.net/og-image.png',
          link: {
            mobileWebUrl: url,
            webUrl: url,
          },
        },
        buttons: [
          {
            title: '자세히 보기',
            link: {
              mobileWebUrl: url,
              webUrl: url,
            },
          },
        ],
      });
      return;
    }

    // 2. SDK가 없거나 문제 발생 시 -> 웹 공유 URL로 대체 (Fallback)
    const kakaoUrl = `https://sharer.kakao.com/talk/friends/picker/link?url=${encodeURIComponent(url)}`;
    window.open(kakaoUrl, "_blank", "width=600,height=700");
  };

  // 트위터(X) 공유
  const shareTwitter = () => {
    const text = `${cleanTitle}\n${cleanDescription}`.slice(0, 200);
    // x.com 도메인 사용 권장
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      text
    )}&url=${encodeURIComponent(url)}`;
    window.open(twitterUrl, "_blank", "width=600,height=600,noopener,noreferrer");
  };

  // Threads 공유
  const shareThreads = () => {
    // URL을 텍스트 끝에 명시적으로 추가하여 미리보기가 잘 뜨도록 유도
    const text = `${cleanTitle}\n${cleanDescription}\n\n${url}`.slice(0, 500);
    const threadsUrl = `https://www.threads.net/intent/post?text=${encodeURIComponent(text)}`;
    window.open(threadsUrl, "_blank", "width=600,height=750,noopener,noreferrer");
  };

  // 네이티브 공유 (모바일)
  const shareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: description,
          url: url,
        });
      } catch (error) {
        console.error("공유 실패:", error);
      }
    } else {
      copyToClipboard();
    }
  };

  const shareOptions = [
    {
      name: "카카오톡",
      icon: faComment,
      color: "bg-[#FEE500] hover:bg-[#F5DC00] text-[#3C1E1E]",
      onClick: shareKakao,
    },
    {
      name: "트위터(X)",
      icon: faXTwitter,
      color: "bg-black hover:bg-gray-800 text-white",
      onClick: shareTwitter,
    },
    {
      name: "Threads",
      icon: faThreads,
      color: "bg-gradient-to-r from-gray-900 to-gray-700 hover:from-gray-800 hover:to-gray-600 text-white",
      onClick: shareThreads,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">공유하기</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* SNS 공유 버튼들 */}
          <div className="grid grid-cols-3 gap-4">
            {shareOptions.map((option) => (
              <button
                key={option.name}
                onClick={option.onClick}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-all ${option.color}`}
              >
                <FontAwesomeIcon icon={option.icon} className="w-6 h-6" />
                <span className="text-xs font-medium">{option.name}</span>
              </button>
            ))}
          </div>

          {/* 구분선 */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-2 text-gray-500">또는</span>
            </div>
          </div>

          {/* URL 복사 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">링크 복사</label>
            <div className="flex gap-2">
              <Input
                value={url}
                readOnly
                className="bg-gray-50 text-sm"
                onClick={(e) => e.currentTarget.select()}
              />
              <Button
                onClick={copyToClipboard}
                variant="outline"
                className={`min-w-[80px] ${
                  copied
                    ? "bg-green-50 text-green-600 border-green-200"
                    : ""
                }`}
              >
                {copied ? (
                  <>
                    <FontAwesomeIcon icon={faCheck} className="w-4 h-4 mr-1" />
                    복사됨
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faCopy} className="w-4 h-4 mr-1" />
                    복사
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* 네이티브 공유 (모바일) */}
          {supportsNativeShare && (
            <Button
              onClick={shareNative}
              variant="outline"
              className="w-full"
            >
              <FontAwesomeIcon icon={faLink} className="w-4 h-4 mr-2" />
              더 많은 방법으로 공유
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ShareModal;
