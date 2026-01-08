"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { getBlurDataURL } from "@/lib/utils/imageOptimization";
import {
  Card,
  CardContent,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  Skeleton,
} from "@/components/ui/index";
import Link from "next/link";
import { ExternalLink } from "lucide-react";

interface Banner {
  id: number;
  title: string;
  subtitle: string | null;
  description: string | null;
  button_text: string | null;
  image_url: string;
  link_url: string | null;
  bg_color: string;
  text_color: string;
  priority: number;
}

export function MainBanner() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    let isMounted = true;

    // 캐시 확인 함수
    const checkCache = () => {
      try {
        const cached = localStorage.getItem("main_banners_cache");
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          // 1시간 유효 기간
          if (Date.now() - timestamp < 60 * 60 * 1000) {
            setBanners(data);
            setLoading(false);
            return true;
          }
        }
      } catch (e) {
        console.error("Cache parsing error", e);
      }
      return false;
    };

    const loadBanners = async () => {
      // 캐시가 있으면 먼저 보여줌 (백그라운드에서 최신 데이터 갱신)
      const hasCache = checkCache();
      
      try {
        // 1. 전용 배너 테이블 조회
        const { data: dedicatedBanners, error: dbError } = await supabase
          .from("banners")
          .select("*")
          .eq("is_active", true);

        // 2. 관리자 페이지에서 배너로 설정된 공모전/행사 조회
        const { data: promotedRecruits, error: prError } = await supabase
          .from("recruit_items")
          .select("*")
          .eq("show_as_banner", true)
          .eq("is_active", true)
          .eq("is_approved", true);

        if (dbError) throw dbError;
        if (prError) throw prError;

        // 데이터 통합
        const mergedBanners: Banner[] = [
          ...((dedicatedBanners || []) as any[]).map(b => ({
            id: b.id,
            title: b.title,
            subtitle: b.subtitle,
            description: b.description,
            button_text: b.button_text,
            image_url: b.image_url,
            link_url: b.link_url,
            bg_color: b.bg_color || "#000000",
            text_color: b.text_color || "#ffffff",
            priority: b.display_order || 999
          })),
          ...((promotedRecruits || []) as any[]).map(r => ({
            id: r.id + 10000, // ID 충돌 방지
            title: r.title,
            subtitle: r.type?.toUpperCase() || "EVENT",
            description: r.description,
            button_text: "자세히 보기",
            image_url: r.banner_image_url || r.thumbnail || "",
            link_url: `/recruit/${r.id}`,
            bg_color: "#000000",
            text_color: "#ffffff",
            priority: r.banner_priority || 999
          }))
        ].sort((a, b) => a.priority - b.priority);

        if (isMounted) {
          if (mergedBanners.length > 0) {
            setBanners(mergedBanners);
            // 캐시 저장
            localStorage.setItem("main_banners_cache", JSON.stringify({
              data: mergedBanners,
              timestamp: Date.now()
            }));
          } else {
             if (!hasCache) throw new Error("No banners found");
          }
        }
      } catch (error) {
        console.warn('배너 로드 실패 (샘플/캐시 데이터 사용):', error);
        
        if (isMounted && !hasCache) {
          // Fallback ... (기존과 동일)
          setBanners([
            {
              id: 0,
              title: "2024 Generative AI Hackathon",
              subtitle: "PREMIUM CONTEST",
              description: "생성형 AI의 무한한 가능성, 당신의 아이디어로 실현하세요",
              button_text: "공모전 확인하기",
              image_url: "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=2670",
              link_url: "/recruit",
              priority: 0,
              bg_color: "#0f172a",
              text_color: "#ffffff"
            },
            {
              id: 1,
              title: "Creative Tech",
              subtitle: "EVENT",
              description: "기술과 예술이 만나는 지점",
              button_text: "이벤트 참여하기",
              image_url: "https://images.unsplash.com/photo-1558655146-d09347e92766?q=80&w=2664&auto=format&fit=crop",
              link_url: "/recruit",
              priority: 1,
              bg_color: "#2a2a2a",
              text_color: "#ffffff"
            }
          ]);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    
    // 캐시가 없으면 로딩 상태로 시작, 있으면 로딩 false 상태로 시작
    if (!checkCache()) {
       loadBanners();
    } else {
       // 캐시가 있어도 최신 데이터 확인을 위해 백그라운드 실행
       loadBanners();
    }
    
    return () => { isMounted = false; };
  }, []);

  if (loading) {
    return (
      <section className="w-full">
        <Carousel className="w-full">
          <CarouselContent className="w-full flex justify-start gap-4 -ml-4">
            <Skeleton className="min-w-[90vw] md:min-w-[600px] w-[90vw] md:w-[600px] h-[300px] md:h-[400px] rounded-2xl ml-4" />
            <Skeleton className="min-w-[90vw] md:min-w-[600px] w-[90vw] md:w-[600px] h-[300px] md:h-[400px] rounded-2xl" />
          </CarouselContent>
        </Carousel>
      </section>
    );
  }

  if (banners.length === 0) return null;

  return (
    <section className="w-full">
      <Carousel
        opts={{
          align: "start",
          loop: true,
        }}
        className="w-full"
      >
        <CarouselContent className="w-full flex justify-start gap-4 -ml-4 pt-0 pb-6 px-1">
          {banners.map((banner, index) => (
            <CarouselItem
              key={banner.id}
              className="basis-[85vw] md:basis-1/3 lg:basis-1/4 pl-4"
            >
              <Link href={banner.link_url || "#"} className={banner.link_url ? "cursor-pointer" : "cursor-default"}>
                <Card 
                  className="w-full h-[360px] md:h-[480px] overflow-hidden hover:shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] transition-all duration-700 border-none rounded-[40px] group relative"
                >
                  <CardContent className="h-full p-0 relative">
                    {/* Optimized Image with Next.js Image component */}
                    <div className="absolute inset-0 bg-slate-50 overflow-hidden rounded-[40px]">
                      <img 
                        src={banner.image_url || "/placeholder.jpg"}
                        alt="" 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        onError={(e) => {
                          // @ts-ignore
                          e.target.src = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop";
                        }}
                      />
                    </div>
                    
                    {/* Modern Overlay - More subtle */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent z-10" />

                    {/* Content Box - Slim & Premium Floating Style */}
                    <div className="absolute bottom-10 left-8 right-8 md:left-12 md:bottom-12 z-20 flex flex-col items-start gap-1">
                      {banner.subtitle && (
                        <div 
                          className="px-2.5 py-1 rounded-full text-[9px] md:text-[11px] font-black tracking-widest uppercase bg-[#4ACAD4] text-slate-900 w-fit mb-2 shadow-lg shadow-[#4ACAD4]/20"
                        >
                          {banner.subtitle}
                        </div>
                      )}
                      
                       <h2 
                        className="text-xl md:text-3xl font-black tracking-tighter leading-[1.15] mb-3 drop-shadow-xl"
                        style={{ color: banner.text_color }}
                      >
                        {banner.title}
                      </h2>

                       {banner.description && (
                        <p 
                          className="text-[11px] md:text-sm font-bold opacity-90 max-w-2xl line-clamp-2 mb-6 leading-relaxed"
                          style={{ color: banner.text_color }}
                        >
                          {banner.description}
                        </p>
                      )}
                      
                       {banner.link_url && (
                        <div 
                          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-black transition-all duration-500 group-hover:bg-[#4ACAD4] group-hover:text-slate-900 font-black text-xs md:text-sm shadow-2xl shadow-black/20"
                        >
                          <span>{banner.button_text || "자세히 보기"}</span>
                          <ExternalLink size={14} className="group-hover:translate-x-1 transition-transform" />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </CarouselItem>
          ))}
        </CarouselContent>
        {banners.length > 1 && (
          <>
            <CarouselPrevious className="left-8 w-12 h-12 rounded-full border-none bg-white/10 hover:bg-white/20 backdrop-blur-md text-white hidden md:flex" />
            <CarouselNext className="right-8 w-12 h-12 rounded-full border-none bg-white/10 hover:bg-white/20 backdrop-blur-md text-white hidden md:flex" />
          </>
        )}
      </Carousel>
    </section>
  );
}

export default MainBanner;
