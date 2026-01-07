// src/components/recruit/RecruitDetailClient.tsx
"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  Building2, 
  Award, 
  Briefcase, 
  ChevronRight,
  Clock,
  Share2,
  Eye,
  CalendarDays
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Item {
  id: number;
  title: string;
  description: string;
  type: "job" | "contest" | "event";
  date: string;
  location?: string;
  prize?: string;
  salary?: string;
  company?: string;
  employment_type?: string;
  link?: string;
  thumbnail?: string;
  views_count?: number;
  created_at?: string;
}

export default function RecruitDetailClient({ item }: { item: Item }) {
  const router = useRouter();

  const getDday = (dateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(dateStr);
    targetDate.setHours(0, 0, 0, 0);
    const diff = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return '마감';
    if (diff === 0) return 'D-Day';
    return `D-${diff}`;
  };

  const handleShare = () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({
        title: item.title,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('링크가 복사되었습니다.');
    }
  };

  const dday = getDday(item.date);
  const isExpired = dday === '마감';

  return (
    <div className="min-h-screen bg-[#fafafa] pb-24">
      {/* Top Navigation */}
      <div className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Button 
            variant="ghost" 
            className="rounded-full hover:bg-slate-100 -ml-2 text-slate-600 font-bold"
            onClick={() => router.back()}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> 뒤로가기
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="rounded-full" onClick={handleShare}>
              <Share2 className="h-4 w-4 text-slate-600" />
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Left: Image & Main Info */}
          <div className="lg:col-span-7 space-y-8">
            <div className="relative aspect-[16/10] w-full rounded-[48px] overflow-hidden shadow-2xl bg-white group">
              {item.thumbnail ? (
                <Image 
                  src={item.thumbnail} 
                  alt={item.title} 
                  fill 
                  className="object-cover transition-transform duration-1000 group-hover:scale-105"
                  priority
                />
              ) : (
                <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-200">
                  {item.type === 'contest' ? <Award size={120} strokeWidth={1} /> : <Briefcase size={120} strokeWidth={1} />}
                </div>
              )}
              
              <div className="absolute top-8 left-8 flex gap-3">
                <Badge className="bg-white/90 backdrop-blur-md text-slate-900 border-none px-4 py-2 rounded-full text-xs font-black tracking-widest uppercase shadow-lg">
                  {item.type === 'job' ? 'RECRUIT' : item.type === 'contest' ? 'CONTEST' : 'EVENT'}
                </Badge>
                <Badge className={`${isExpired ? 'bg-slate-400' : 'bg-[#4ACAD4]'} text-white border-none px-4 py-2 rounded-full text-xs font-black tracking-widest uppercase shadow-lg`}>
                  {dday}
                </Badge>
              </div>
            </div>

            <div className="space-y-6 px-2">
              <div className="space-y-3">
                {item.company && (
                  <div className="flex items-center gap-2 text-[#4ACAD4] font-black tracking-wider uppercase text-sm">
                    <Building2 size={16} />
                    {item.company}
                  </div>
                )}
                <h1 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 leading-tight">
                  {item.title}
                </h1>
              </div>

              <div className="p-8 rounded-[40px] bg-white shadow-sm border border-slate-100 space-y-6">
                <h3 className="text-xl font-bold text-slate-900">상세 정보</h3>
                <p className="text-slate-600 leading-relaxed whitespace-pre-wrap font-medium text-lg">
                  {item.description}
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12 pt-6 border-t border-slate-50">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-[#4ACAD4] shrink-0">
                      <Clock size={20} />
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">마감일</p>
                      <p className="text-slate-800 font-bold">{new Date(item.date).toLocaleDateString("ko-KR", { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                  </div>
                  
                  {item.location && (
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-[#4ACAD4] shrink-0">
                        <MapPin size={20} />
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">장소</p>
                        <p className="text-slate-800 font-bold">{item.location}</p>
                      </div>
                    </div>
                  )}

                  {item.prize && (
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-[#4ACAD4] shrink-0">
                        <Award size={20} />
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">상금/혜택</p>
                        <p className="text-slate-800 font-bold">{item.prize}</p>
                      </div>
                    </div>
                  )}

                  {(item.salary || item.employment_type) && (
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-[#4ACAD4] shrink-0">
                        <Briefcase size={20} />
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">조건</p>
                        <p className="text-slate-800 font-bold">
                          {item.employment_type} {item.salary && `| ${item.salary}`}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right: CTA Section */}
          <div className="lg:col-span-5">
            <div className="sticky top-28 space-y-6">
              <div className="p-8 md:p-10 rounded-[48px] bg-slate-900 text-white shadow-2xl shadow-slate-200 space-y-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#4ACAD4]/20 blur-3xl rounded-full -mr-16 -mt-16" />
                
                <div className="space-y-2 relative z-10">
                  <p className="text-slate-400 font-bold text-sm">지금 바로 도전하세요</p>
                  <h2 className="text-2xl font-black">더 자세한 내용을 확인하시겠습니까?</h2>
                </div>

                <div className="space-y-3 relative z-10">
                  {item.link && (
                    <Button 
                      className="w-full h-16 rounded-2xl bg-[#4ACAD4] hover:bg-[#3db8c1] text-white font-black text-lg shadow-xl shadow-[#4ACAD4]/20 transition-all duration-300 hover:scale-[1.02]"
                      onClick={() => window.open(item.link, '_blank')}
                      disabled={isExpired}
                    >
                      공식 홈페이지 바로가기
                      <ChevronRight className="ml-2" />
                    </Button>
                  )}
                  <p className="text-center text-slate-500 text-xs font-medium">
                    클릭 시 주최측 공식 홈페이지로 이동합니다.
                  </p>
                </div>

                <div className="pt-6 border-t border-slate-800 space-y-4 relative z-10">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400 font-medium flex items-center gap-2">
                       <Eye size={14} /> 조회수
                    </span>
                    <span className="font-bold">{item.views_count?.toLocaleString() || 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400 font-medium flex items-center gap-2">
                      <CalendarDays size={14} /> 제보일
                    </span>
                    <span className="font-bold">
                      {item.created_at ? new Date(item.created_at).toLocaleDateString() : '-'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tips Section */}
              <div className="p-8 rounded-[40px] bg-white border border-slate-100 shadow-sm space-y-4">
                <p className="text-slate-900 font-black flex items-center gap-2">
                  <Award className="text-[#4ACAD4]" size={18} />
                  에디터의 팁
                </p>
                <div className="text-sm text-slate-500 font-medium leading-relaxed space-y-2">
                  <p>이 {item.type === 'contest' ? '공모전' : '모집'}은 포트폴리오의 실전 감각을 익히기에 아주 좋은 기회입니다.</p>
                  <p>기획 의도를 명확히 파악하고 트렌디한 감각을 더해보세요!</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
