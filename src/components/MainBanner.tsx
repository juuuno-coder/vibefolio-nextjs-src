"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
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
        // 1.5초 타임아웃으로 단축
        const fetchPromise = supabase
          .from("banners")
          .select("*")
          .eq("is_active", true)
          .order("display_order", { ascending: true });
          
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Timeout")), 1500)
        );

        // @ts-ignore
        const { data, error } = await Promise.race([fetchPromise, timeoutPromise]);

        if (error) throw error;
        
        if (isMounted) {
          if (data && data.length > 0) {
            setBanners(data);
            // 캐시 저장
            localStorage.setItem("main_banners_cache", JSON.stringify({
              data,
              timestamp: Date.now()
            }));
          } else {
            // DB에 데이터가 없으면 Fallback 사용하도록 에러 던짐
             if (!hasCache) throw new Error("No banners found");
          }
        }
      } catch (error) {
        console.warn('배너 로드 실패 또는 타임아웃 (샘플/캐시 데이터 사용):', error);
        
        if (isMounted && !hasCache) {
          // 캐시도 없고 로드도 실패했을 때만 샘플 표시
          setBanners([
            {
              id: 0,
              title: "AI Contest 2024",
              subtitle: "CONTEST",
              description: "새로운 생성형 AI의 가능성에 도전하세요",
              button_text: "공모전 확인하기",
              image_url: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2670&auto=format&fit=crop",
              link_url: "/recruit",
              bg_color: "#1a1a1a",
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
              bg_color: "#2a2a2a",
              text_color: "#ffffff"
            },
            {
              id: 2,
              title: "Vibe Insight",
              subtitle: "TREND",
              description: "이번 주 가장 주목받는 AI 디자인 트렌드",
              button_text: "트렌드 읽어보기",
              image_url: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=2670&auto=format&fit=crop",
              link_url: "/",
              bg_color: "#4a148c",
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
    <section className="w-full min-h-[340px] md:min-h-[470px]">
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
              className="basis-[92vw] md:basis-[700px] pl-4"
            >
              <Link href={banner.link_url || "#"} className={banner.link_url ? "cursor-pointer" : "cursor-default"}>
                <Card 
                  className="w-full h-[320px] md:h-[450px] overflow-hidden hover:shadow-2xl transition-shadow duration-300 border-none rounded-[32px] group relative"
                >
                  <CardContent className="h-full p-0 relative">
                    {/* Optimized Image with Next.js Image component */}
                    <Image 
                      src={banner.image_url}
                      alt={banner.title}
                      fill
                      priority={index === 0} // First banner loads with priority
                      sizes="(max-width: 768px) 92vw, 700px"
                      className="object-cover"
                      quality={90}
                      placeholder="blur"
                      blurDataURL={getBlurDataURL(700, 450)}
                    />
                    
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent z-10" />

                    {/* Content */}
                    <div className="absolute bottom-0 left-0 w-full p-8 md:p-10 flex flex-col items-start gap-1 z-20">
                      {banner.description && (
                        <p 
                          className="text-sm md:text-base font-medium opacity-90 max-w-lg line-clamp-2 mb-1"
                          style={{ color: banner.text_color }}
                        >
                          {banner.description}
                        </p>
                      )}
                      
                      <h2 
                        className="text-3xl md:text-5xl font-black tracking-tight leading-tight mb-2"
                        style={{ color: banner.text_color }}
                      >
                        {banner.title}
                      </h2>
                      
                      {banner.subtitle && (
                        <div 
                          className="px-3 py-1 rounded-full text-[10px] md:text-xs font-bold tracking-widest uppercase backdrop-blur-md bg-white/20 border border-white/30 w-fit"
                          style={{ color: banner.text_color }}
                        >
                          {banner.subtitle}
                        </div>
                      )}
                      
                      {banner.link_url && (
                        <div 
                          className="mt-4 flex items-center gap-3 px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/20 transition-all duration-300 group-hover:scale-105"
                          style={{ color: banner.text_color }}
                        >
                          <span className="text-sm font-bold">{banner.button_text || "자세히 보기"}</span>
                          <ExternalLink size={16} className="group-hover:translate-x-1 transition-transform" />
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
