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
        // [Guest Mode] Simple demo-style success or guest API call
        alert("비회원으로 제안이 전송되었습니다! (Demo)");
        setFormData({ title: "", content: "", contact: "" });
        onOpenChange(false);
        return;
      }

      const res = await fetch("/api/proposals", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          project_id: Number(projectId),
          receiver_id: receiverId,
          title: formData.title || `[심사평] ${projectTitle}에 대한 전문 의견`,
          content: formData.content,
          contact: formData.contact,
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
      <DialogContent className="max-w-md rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 h-2 w-full" />
        
        <div className="p-8">
          <DialogHeader className="flex flex-col items-center text-center space-y-4 mb-8">
            <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center shadow-inner border border-slate-100">
               <div className="relative">
                  <span className="text-4xl">📧</span>
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full border-2 border-white flex items-center justify-center shadow-sm">
                     <span className="text-[10px] text-white">❤️</span>
                  </div>
               </div>
            </div>
            <div>
              <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight flex items-center justify-center gap-2">
                시크릿 심사평 보내기
                <div className="bg-amber-100 text-amber-700 text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 font-bold">
                  🔒 개발자 전용
                </div>
              </DialogTitle>
              <p className="text-sm text-slate-500 mt-2 font-medium leading-relaxed">
                작성하신 내용은 <span className="text-indigo-600 font-bold">작성자(개발자)에게만 비공개로</span> 전달됩니다.<br/>
                작품의 발전을 위한 따뜻한 응원과 솔직한 의견을 남겨주세요.
              </p>
            </div>
          </DialogHeader>
          
          <div className="px-8 pb-4">
             <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 mb-2">
                <p className="text-[10px] text-amber-700 font-bold leading-tight">
                  ⚠️ 악성 댓글, 욕설, 타인 비하 발언 등은 AI 필터링에 의해 자동 삭제될 수 있으며, 운영 정책에 따라 이용이 제한될 수 있습니다.
                </p>
             </div>
          </div>
  
          <form onSubmit={(e) => {
            // Set a default title if not provided
            if (!formData.title) {
              setFormData(prev => ({ ...prev, title: `[심사평] ${projectTitle}에 대한 전문 의견` }));
            }
            handleSubmit(e);
          }} className="space-y-6">
            <div className="space-y-4">
              <div className="relative">
                <Textarea
                  placeholder="내용을 입력하세요..."
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="min-h-[160px] rounded-2xl border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-slate-200 transition-all resize-none p-4 text-base"
                  required
                />
              </div>
    
              <div className="relative">
                <Input
                  placeholder="연락처 (이메일 또는 전화번호)"
                  value={formData.contact}
                  onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                  className="rounded-xl border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-slate-200 h-12 px-4"
                  required
                />
              </div>
            </div>
  
            <div className="flex flex-col gap-3 pt-2">
              <Button type="submit" className="h-14 rounded-2xl bg-slate-950 hover:bg-slate-800 text-white font-black text-base shadow-xl hover:shadow-slate-200 transition-all group" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    심사평 전송 중...
                  </>
                ) : (
                  <>
                    비공개 심사평 보내기
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                className="text-slate-400 font-bold hover:text-slate-600 lg:hidden"
              >
                닫기
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
