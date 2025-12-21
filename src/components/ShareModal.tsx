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
import { faFacebook, faXTwitter } from "@fortawesome/free-brands-svg-icons";

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

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("클립보드 복사 실패:", error);
    }
  };

  // 카카오톡 공유
  const shareKakao = () => {
    // 카카오 SDK가 로드되어 있는지 확인
    if (typeof window !== "undefined" && (window as any).Kakao) {
      const Kakao = (window as any).Kakao;
      
      if (!Kakao.isInitialized()) {
        // 카카오 앱 키로 초기화 (실제 앱 키로 교체 필요)
        // Kakao.init('YOUR_KAKAO_JAVASCRIPT_KEY');
        alert('카카오 공유 기능은 카카오 앱 키 설정 후 사용 가능합니다.');
        return;
      }

      Kakao.Share.sendDefault({
        objectType: "feed",
        content: {
          title: title,
          description: description,
          imageUrl: imageUrl,
          link: {
            mobileWebUrl: url,
            webUrl: url,
          },
        },
        buttons: [
          {
            title: "자세히 보기",
            link: {
              mobileWebUrl: url,
              webUrl: url,
            },
          },
        ],
      });
    } else {
      // 카카오 SDK가 없는 경우 카카오톡 공유 URL로 이동
      const kakaoUrl = `https://story.kakao.com/share?url=${encodeURIComponent(url)}`;
      window.open(kakaoUrl, "_blank", "width=600,height=600");
    }
  };

  // 트위터(X) 공유
  const shareTwitter = () => {
    const text = `${title}\n${description}`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      text
    )}&url=${encodeURIComponent(url)}`;
    window.open(twitterUrl, "_blank", "width=600,height=600");
  };

  // 페이스북 공유
  const shareFacebook = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
      url
    )}`;
    window.open(facebookUrl, "_blank", "width=600,height=600");
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
      name: "페이스북",
      icon: faFacebook,
      color: "bg-[#1877F2] hover:bg-[#166FE5] text-white",
      onClick: shareFacebook,
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
