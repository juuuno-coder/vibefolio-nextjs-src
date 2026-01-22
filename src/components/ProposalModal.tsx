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
      const { supabase } = await import("@/lib/supabase/client");
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        alert("로그인이 필요한 서비스입니다.");
        setLoading(false);
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
          title: formData.title || `[협업 제안] ${projectTitle} 관련 문의`,
          content: formData.content,
          contact: formData.contact,
        }),
      });

      const data = await res.json();
      
      if (res.ok) {
        try {
          const { createNotification } = await import("@/hooks/useNotifications");
          await createNotification({
            userId: receiverId,
            type: "system",
            title: "새로운 협업 제안이 도착했습니다!",
            message: `'${formData.title || projectTitle}' 제안을 확인해보세요.`,
            link: "/mypage",
            senderId: session.user.id,
          });
        } catch (err) {
          console.error("알림 생성 실패:", err);
        }

        alert(data.message || "제안이 성공적으로 전송되었습니다!");
        setFormData({ title: "", content: "", contact: "" });
        onOpenChange(false);
      } else {
        alert(data.error || "제안 등록에 실패했습니다.");
      }
    } catch (error) {
      console.error("제안 전송 실패:", error);
      alert("제안 전송 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 h-2 w-full" />
        
        <div className="p-8">
          <DialogHeader className="flex flex-col items-center text-center space-y-4 mb-8">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center shadow-inner border border-emerald-100/50">
               <span className="text-4xl text-emerald-600">🤝</span>
            </div>
            <div>
              <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight">협업 제안하기</DialogTitle>
              <p className="text-sm text-slate-500 mt-2 font-medium leading-relaxed">
                창작자에게 협업이나 프로젝트 제안을 보내보세요.<br/>
                상세한 내용과 연락처를 남겨주시면 전달됩니다.
              </p>
            </div>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <Input
                placeholder="제목 (예: 프로젝트 공동 작업 문의)"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="h-12 rounded-xl border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-slate-200"
                required
              />
              <Textarea
                placeholder="제안 내용을 상세히 입력해주세요..."
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="min-h-[160px] rounded-2xl border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-slate-200 transition-all resize-none p-4"
                required
              />
              <Input
                placeholder="답변을 받을 연락처 (이메일 등)"
                value={formData.contact}
                onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                className="h-12 rounded-xl border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-slate-200"
                required
              />
            </div>
  
            <div className="flex flex-col gap-3 pt-2">
              <Button type="submit" className="h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-base shadow-xl transition-all" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "제안 보내기"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
