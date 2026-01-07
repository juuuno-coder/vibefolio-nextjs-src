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
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mb-4">
            <FontAwesomeIcon icon={faLock} className="w-7 h-7 text-white" />
          </div>

          {/* 제목 */}
          <DialogTitle className="text-xl font-bold text-gray-900 mb-2">
            로그인이 필요합니다
          </DialogTitle>

          {/* 메시지 */}
          <p className="text-gray-500 text-sm mb-6">
            {message}
          </p>

          {/* 버튼들 */}
          <div className="flex gap-3 w-full">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 h-11 rounded-full"
            >
              취소
            </Button>
            <Button
              onClick={handleLogin}
              className="flex-1 h-11 rounded-full bg-green-600 hover:bg-green-700 text-white"
            >
              <FontAwesomeIcon icon={faRightToBracket} className="w-4 h-4 mr-2" />
              로그인
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
