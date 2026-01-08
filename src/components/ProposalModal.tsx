"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

interface ProposalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  receiverId: string;
  projectTitle: string;
}

export function ProposalModal({
  open,
  onOpenChange,
  projectId,
  receiverId,
  projectTitle,
}: ProposalModalProps) {
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    contact: "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!receiverId) {
      alert("프로젝트 작성자 정보를 찾을 수 없습니다.");
      return;
    }

    setLoading(true);

    try {
      // 동적 import로 supabase 가져오기
      const { supabase } = await import("@/lib/supabase/client");
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        alert("로그인이 필요합니다.");
        return;
      }

      const res = await fetch("/api/proposals", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          project_id: parseInt(projectId),
          receiver_id: receiverId,
          ...formData,
        }),
      });

      const data = await res.json();
      
      if (res.ok) {
        // 알림 생성
        try {
          const { createNotification } = await import("@/hooks/useNotifications");
          await createNotification({
            userId: receiverId,
            type: "system", // 제안은 시스템/상호작용 알림으로 분류
            title: "새로운 제안이 도착했습니다!",
            message: `'${formData.title}' 제안을 확인해보세요.`,
            link: "/mypage", // 제안 목록은 마이페이지에서 확인 가능
            senderId: session.user.id,
          });
        } catch (err) {
          console.error("알림 생성 실패:", err);
        }

        alert(data.message || "제안이 전송되었습니다!");
        setFormData({ title: "", content: "", contact: "" });
        onOpenChange(false);
      } else {
        console.error('제안 등록 실패:', data);
        alert(`제안 등록에 실패했습니다.\n\n이유: ${data.error || '알 수 없는 오류'}\n${data.details ? `상세: ${data.details}` : ''}`);
      }
    } catch (error) {
      console.error("제안 전송 실패:", error);
      alert("제안 전송 중 네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>제안하기</DialogTitle>
          <p className="text-sm text-gray-500 mt-2">
            {projectTitle}에 대한 협업/구매 제안을 보냅니다.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <label className="block text-sm font-medium mb-1">제목</label>
            <Input
              placeholder="제안 제목을 입력하세요"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">내용</label>
            <Textarea
              placeholder="제안 내용을 입력하세요"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={6}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">연락처</label>
            <Input
              placeholder="이메일 또는 전화번호"
              value={formData.contact}
              onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
              required
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  전송 중...
                </>
              ) : (
                "제안 보내기"
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              취소
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
