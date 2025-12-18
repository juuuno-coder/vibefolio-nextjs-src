"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Loader2, Megaphone, Calendar, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";

interface Notice {
  id: number;
  title: string;
  content: string;
  is_important: boolean;
  created_at: string;
}

export default function NoticesPage() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadNotices() {
      try {
        const { data, error } = await supabase
          .from("notices")
          .select("*")
          .eq("is_visible", true)
          .order("created_at", { ascending: false });

        if (error) throw error;
        if (data) setNotices(data);
      } catch (e) {
        console.error("Notices Load Error:", e);
      } finally {
        setLoading(false);
      }
    }
    loadNotices();
  }, []);

  return (
    <div className="min-h-screen bg-white py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="border-b border-slate-100 pb-12 mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-bold uppercase tracking-wider mb-6">
            <Megaphone size={14} />
            <span>Community News</span>
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">공지사항</h1>
          <p className="mt-4 text-lg text-slate-500">Vibefolio의 새로운 소식과 주요 업데이트 내용을 알려드립니다.</p>
        </div>

        {/* Notice List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <Loader2 className="animate-spin text-blue-500" size={40} />
            <p className="text-slate-400 font-medium font-sans">최신 공지를 불러오고 있습니다...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notices.map((notice) => (
              <Dialog key={notice.id}>
                <DialogTrigger asChild>
                  <div className="group flex items-center justify-between p-6 rounded-3xl border border-slate-100 bg-white transition-all hover:bg-slate-50 hover:border-slate-200 cursor-pointer">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-3">
                        {notice.is_important && (
                          <Badge className="bg-red-50 text-red-600 hover:bg-red-50 border-0 text-[10px] font-bold px-2 py-0.5 uppercase tracking-tighter shadow-none">
                            IMPORTANT
                          </Badge>
                        )}
                        <span className="text-sm text-slate-400 flex items-center gap-1 font-medium font-mono">
                          <Calendar size={12} />
                          {new Date(notice.created_at).toLocaleDateString("ko-KR", {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit'
                          })}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {notice.title}
                      </h3>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                      <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 transition-colors" />
                    </div>
                  </div>
                </DialogTrigger>
                <DialogContent className="max-w-2xl bg-white rounded-3xl p-8 border-0 shadow-2xl">
                  <DialogHeader className="mb-6 border-b border-slate-50 pb-6">
                    <div className="flex items-center gap-2 mb-2">
                       {notice.is_important && <Badge variant="destructive">중요 공지</Badge>}
                       <span className="text-sm text-slate-400 font-medium">관리자 · {new Date(notice.created_at).toLocaleDateString()}</span>
                    </div>
                    <DialogTitle className="text-2xl font-extrabold text-slate-900 leading-tight">
                      {notice.title}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="text-slate-700 leading-relaxed text-lg whitespace-pre-wrap font-sans">
                    {notice.content}
                  </div>
                  <div className="mt-12 flex justify-center">
                    <img src="/logo.svg" alt="Vibefolio" className="w-32 opacity-20 grayscale" />
                  </div>
                </DialogContent>
              </Dialog>
            ))}
            
            {notices.length === 0 && (
              <div className="text-center py-32 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                <Megaphone size={40} className="mx-auto text-slate-300 mb-4" />
                <p className="text-slate-400 text-lg">새로운 공지사항이 대기 중입니다.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
