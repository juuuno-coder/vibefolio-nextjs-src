"use client";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "./FaIcon";
import { faLock, faRightToBracket } from "@fortawesome/free-solid-svg-icons";
import { useRouter } from "next/navigation";

interface LoginRequiredModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  message?: string;
}

export function LoginRequiredModal({ 
  open, 
  onOpenChange, 
  message = "이 기능을 사용하려면 로그인이 필요합니다." 
}: LoginRequiredModalProps) {
  const router = useRouter();

  const handleLogin = () => {
    onOpenChange(false);
    router.push("/login");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm p-6">
        <div className="flex flex-col items-center text-center">
          {/* 아이콘 */}
          <div className="w-20 h-20 bg-purple-50 rounded-full flex items-center justify-center mb-6 animate-in zoom-in duration-300">
            <span className="text-4xl">👨‍🍳</span>
          </div>

          {/* 제목 */}
          <DialogTitle className="text-2xl font-black text-gray-900 mb-3 tracking-tight">
            잠시만요! 평가위원님! 👨‍🍳
          </DialogTitle>

          {/* 메시지 */}
          <div className="text-gray-500 text-sm mb-8 leading-relaxed max-w-[280px]">
            로그인하고 평가를 진행하시면 <span className="text-orange-500 font-bold">활동 포인트(준비중)</span>가 적립되고, 
            내가 남긴 평가 기록을 언제든 다시 볼 수 있어요.
          </div>

          {/* 버튼들 */}
          <div className="flex flex-col gap-3 w-full">
            <Button
              onClick={handleLogin}
              className="w-full h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-lg shadow-lg shadow-indigo-200 transition-all hover:scale-[1.02]"
            >
              로그인 / 회원가입
            </Button>
            
            <button
              onClick={() => onOpenChange(false)}
              className="py-3 text-xs font-medium text-gray-400 hover:text-gray-600 underline decoration-gray-200 underline-offset-4 transition-colors"
            >
              로그인 없이 게스트로 계속하기
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
