"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Loader2, Megaphone, Calendar, ChevronRight, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";

interface NoticeProject {
  id: number;
  title: string;
  content_text: string;
  created_at: string;
  scheduled_at: string | null;
  custom_data: any;
}

export default function NoticesPage() {
  const [notices, setNotices] = useState<NoticeProject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadNotices() {
      try {
        const nowISO = new Date().toISOString();
        
        // '공지사항' 태그가 포함된 프로젝트 조회
        // scheduled_at이 없거나, 현재 시간보다 과거인 것만 조회
        
        // Note: JSONB filtering with 'contains' is strict. 
        // We fetch projects and filter them in JS if needed, or rely on text search if tags are stored as string sometimes.
        // Assuming custom_data: { tags: ["공지사항", ...] }
        
        const { data, error } = await supabase
          .from("Project")
          .select("*")
          .or(`scheduled_at.is.null,scheduled_at.lte.${nowISO}`)
          .order("created_at", { ascending: false });

        if (error) throw error;
        
        if (data) {
           // Client-side filtering for '공지사항' tag
           const filtered = data.filter((p: any) => {
              if (p.deleted_at) return false;
              let tags: string[] = [];
              try {
                  const cd = typeof p.custom_data === 'string' ? JSON.parse(p.custom_data) : p.custom_data;
                  tags = cd?.tags || [];
              } catch {}
              return tags.includes("공지사항") || tags.includes("Notice") || tags.includes("공지");
           });

           const mapped = filtered.map((p: any) => ({
               id: p.project_id || p.id,
               title: p.title,
               content_text: p.content_text || "",
               created_at: p.created_at,
               scheduled_at: p.scheduled_at,
               custom_data: typeof p.custom_data === 'string' ? JSON.parse(p.custom_data) : p.custom_data,
           }));

           setNotices(mapped);
        }
      } catch (e) {
        console.error("Notices Load Error:", e);
      } finally {
        setLoading(false);
      }
    }
    loadNotices();
  }, []);

  return (
    <div className="min-h-screen bg-white py-20 px-4 sm:px-6 lg:px-8 animate-in fade-in duration-700">
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
            {notices.map((notice) => {
               const isScheduled = notice.scheduled_at && new Date(notice.scheduled_at) > new Date(); // Should not happen due to query filter but safe check
               
               return (
              <Dialog key={notice.id}>
                <DialogTrigger asChild>
                  <div className="group flex items-center justify-between p-6 rounded-3xl border border-slate-100 bg-white transition-all hover:bg-slate-50 hover:border-slate-200 cursor-pointer hover:shadow-sm">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-slate-400 flex items-center gap-1 font-medium font-mono">
                          <Calendar size={12} />
                          {new Date(notice.scheduled_at || notice.created_at).toLocaleDateString("ko-KR", {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit'
                          })}
                        </span>
                        {notice.scheduled_at && (
                            <span className="text-[10px] bg-green-50 text-green-600 px-1.5 py-0.5 rounded font-bold">
                                예약 발행됨
                            </span>
                        )}
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
                <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto bg-white rounded-3xl p-8 border-0 shadow-2xl custom-scrollbar">
                  <DialogHeader className="mb-8 border-b border-slate-50 pb-6">
                    <div className="flex items-center gap-2 mb-3">
                       <span className="text-sm text-slate-400 font-medium flex items-center gap-2">
                            <span>관리자</span>
                            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                            <span>{new Date(notice.scheduled_at || notice.created_at).toLocaleString()}</span>
                       </span>
                    </div>
                    <DialogTitle className="text-2xl font-extrabold text-slate-900 leading-tight">
                      {notice.title}
                    </DialogTitle>
                  </DialogHeader>
                  <div 
                    className="text-slate-700 leading-relaxed text-lg font-sans prose prose-slate max-w-none prose-img:rounded-2xl prose-a:text-blue-600"
                    dangerouslySetInnerHTML={{ __html: notice.content_text }} // Render rich text
                  />
                  <div className="mt-12 flex justify-center pt-8 border-t border-slate-50">
                    <img src="/logo.svg" alt="Vibefolio" className="w-24 opacity-20 grayscale" />
                  </div>
                </DialogContent>
              </Dialog>
            )})}
            
            {notices.length === 0 && (
              <div className="text-center py-32 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                <Megaphone size={40} className="mx-auto text-slate-300 mb-4" />
                <p className="text-slate-400 text-lg">새로운 공지사항이 대기 중입니다.</p>
                <p className="text-slate-400 text-sm mt-2">프로젝트 작성 시 태그에 '공지사항'을 입력하면 이곳에 표시됩니다.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
