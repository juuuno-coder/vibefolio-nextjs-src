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
  CalendarDays,
  Download,
  FileText
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
  
  // 추가 필드
  application_target?: string;
  sponsor?: string;
  total_prize?: string;
  first_prize?: string;
  start_date?: string;
  category_tags?: string;
  banner_image_url?: string;
  images?: string[]; // 상세 이미지 목록
  attachments?: { name: string; url: string; size: number; type: string }[];
}

export default function RecruitDetailClient({ item }: { item: Item }) {
  const router = useRouter();

  // 이미지 표시 우선순위: 배너 > 상세 이미지[0] > 썸네일
  const displayImage = item.banner_image_url || (item.images && item.images.length > 0 ? item.images[0] : null) || item.thumbnail || '';

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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left: Image & Main Info */}
          <div className="lg:col-span-8 space-y-8">
            <div className="relative aspect-video w-full rounded-[48px] overflow-hidden shadow-2xl bg-white group border border-slate-100">
              {displayImage ? (
                <Image 
                  src={displayImage} 
                  alt={item.title} 
                  fill 
                  className="object-cover transition-transform duration-1000"
                  priority
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col items-center justify-center text-slate-200 gap-6">
                  <div className="w-24 h-24 rounded-full bg-white/50 backdrop-blur-sm flex items-center justify-center shadow-inner">
                    {item.type === 'contest' ? <Award size={48} strokeWidth={1.5} className="text-slate-300" /> : <Briefcase size={48} strokeWidth={1.5} className="text-slate-300" />}
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-slate-400 font-black text-[10px] tracking-[0.3em] uppercase opacity-60">Visual Pending</span>
                    <span className="text-slate-300 font-bold text-xs">포스터 이미지를 준비 중입니다</span>
                  </div>
                </div>
              )}
              
              <div className="absolute top-8 left-8 flex gap-3">
                <Badge className="bg-white/90 backdrop-blur-md text-slate-900 border-none px-4 py-2 rounded-full text-xs font-black tracking-widest uppercase shadow-lg">
                  {item.type === 'job' ? 'RECRUIT' : item.type === 'contest' ? 'CONTEST' : 'EVENT'}
                </Badge>
                <Badge className={`${isExpired ? 'bg-slate-400' : 'bg-[#16A34A]'} text-white border-none px-4 py-2 rounded-full text-xs font-black tracking-widest uppercase shadow-lg`}>
                  {dday}
                </Badge>
              </div>
            </div>

            <div className="space-y-6 px-2">
              <div className="space-y-3">
                {item.company && (
                  <div className="flex items-center gap-2 text-[#16A34A] font-black tracking-wider uppercase text-sm">
                    <Building2 size={16} />
                    {item.company}
                  </div>
                )}
                <h1 className="text-xl md:text-3xl font-black tracking-tighter text-slate-900 leading-[1.15] break-keep">
                  {item.title}
                </h1>
              </div>

              <div className="p-8 rounded-[40px] bg-white shadow-sm border border-slate-100 space-y-6">
                <h3 className="text-lg font-bold text-slate-900">상세 정보</h3>
                <p className="text-slate-600 leading-relaxed whitespace-pre-wrap font-medium text-base">
                  {item.description}
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12 pt-6 border-t border-slate-50">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-[#16A34A] shrink-0">
                      <CalendarDays size={20} />
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">접수 기간</p>
                      <p className="text-slate-800 font-bold">
                        {item.start_date ? `${new Date(item.start_date).toLocaleDateString("ko-KR")} ~ ` : ""}
                        {new Date(item.date).toLocaleDateString("ko-KR")}
                      </p>
                    </div>
                  </div>
                  
                  {item.application_target && (
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-[#16A34A] shrink-0">
                        <Briefcase size={20} />
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">응모 대상</p>
                        <p className="text-slate-800 font-bold">{item.application_target}</p>
                      </div>
                    </div>
                  )}

                  {item.category_tags && (
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-[#16A34A] shrink-0">
                        <Award size={20} />
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">분야</p>
                        <p className="text-slate-800 font-bold">{item.category_tags}</p>
                      </div>
                    </div>
                  )}

                  {item.total_prize && (
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-[#16A34A] shrink-0">
                        <Award size={20} />
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">총 상금</p>
                        <p className="text-[#16A34A] font-bold">{item.total_prize}</p>
                      </div>
                    </div>
                  )}

                  {item.first_prize && (
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-[#16A34A] shrink-0">
                        <Award size={20} />
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">1등 상금</p>
                        <p className="text-slate-800 font-bold">{item.first_prize}</p>
                      </div>
                    </div>
                  )}

                  {item.sponsor && (
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-[#16A34A] shrink-0">
                        <Building2 size={20} />
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">후원/협찬</p>
                        <p className="text-slate-800 font-bold">{item.sponsor}</p>
                      </div>
                    </div>
                  )}

                  {item.location && (
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-[#16A34A] shrink-0">
                        <MapPin size={20} />
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">장소</p>
                        <p className="text-slate-800 font-bold">{item.location}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right: CTA Section */}
          <div className="lg:col-span-4">
            <div className="sticky top-28 space-y-6">
              <div className="p-8 md:p-8 rounded-[40px] bg-white text-slate-900 shadow-xl shadow-slate-100 border border-slate-100 space-y-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 blur-3xl rounded-full -mr-16 -mt-16" />
                
                <div className="space-y-1.5 relative z-10">
                  <p className="text-[#16A34A] font-bold text-xs uppercase tracking-widest">Apply Now</p>
                  <h2 className="text-lg font-black leading-tight">지금 바로 지원하세요</h2>
                </div>

                <div className="space-y-3 relative z-10">
                  {/* 첨부파일 섹션 */}
                  {item.attachments && item.attachments.length > 0 && (
                    <div className="space-y-3 pb-4 border-b border-slate-100 relative z-10">
                      <p className="text-slate-500 font-bold text-xs uppercase tracking-widest flex items-center gap-2">
                         <FileText size={12} /> Documents
                      </p>
                      <div className="space-y-2">
                        {item.attachments.map((file, idx) => (
                          <Button
                            key={idx}
                            variant="ghost"
                            className="w-full h-auto py-3 px-4 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-100 text-left flex items-center justify-between group"
                            onClick={() => window.open(file.url, '_blank')}
                          >
                            <div className="flex items-center gap-3 min-w-0 pr-3">
                               <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center border border-slate-200 text-slate-400 shrink-0 group-hover:border-slate-300 group-hover:text-slate-600 transition-colors">
                                  <FileText size={16} />
                               </div>
                               <div className="flex flex-col min-w-0">
                                   <span className="text-slate-900 text-xs font-bold truncate max-w-[160px] leading-tight mb-0.5">{file.name}</span>
                                   <span className="text-slate-400 text-[10px] font-medium">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                               </div>
                            </div>
                            <Download size={14} className="text-slate-300 group-hover:text-slate-600 transition-colors shrink-0 ml-2" />
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {item.link && (
                    <Button 
                      className="w-full h-14 rounded-2xl bg-[#16A34A] hover:bg-[#15803d] text-white font-black text-base shadow-lg shadow-[#16A34A]/20 transition-all duration-300 hover:scale-[1.02]"
                      onClick={() => window.open(item.link, '_blank')}
                      disabled={isExpired}
                    >
                      {item.type === 'job' ? '채용 신청하기' : item.type === 'contest' ? '공모전 신청하기' : '참여하기'}
                      <ChevronRight className="ml-1" size={18} />
                    </Button>
                  )}
                  <p className="text-center text-slate-400 text-[10px] font-bold">
                    클릭 시 공식 홈페이지 또는 신청 페이지로 이동합니다.
                  </p>
                </div>

                <div className="pt-5 border-t border-slate-100 space-y-3 relative z-10">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-bold flex items-center gap-2 uppercase tracking-tighter">
                       <Eye size={12} /> Views
                    </span>
                    <span className="font-black text-slate-900">{item.views_count?.toLocaleString() || 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-bold flex items-center gap-2 uppercase tracking-tighter">
                      <CalendarDays size={12} /> Posted
                    </span>
                    <span className="font-black text-slate-900">
                      {item.created_at ? new Date(item.created_at).toLocaleDateString() : '-'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tips Section */}
              <div className="p-8 rounded-[40px] bg-white border border-slate-100 shadow-sm space-y-4">
                <p className="text-slate-900 font-black flex items-center gap-2">
                  <Award className="text-[#16A34A]" size={18} />
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
