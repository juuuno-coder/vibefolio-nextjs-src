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

import Image from "next/image";

interface Banner {
  id: number;
  title: string;
  subtitle: string | null;
  description: string | null;
  description_one_line?: string | null;
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
        const [bnRes, prRes] = await Promise.all([
          supabase.from("banners").select("*").eq("is_active", true),
          supabase.from("recruit_items").select("*").eq("show_as_banner", true).eq("is_active", true).eq("is_approved", true)
        ]);
        const { data: dedicatedBanners, error: dbError } = bnRes;
        const { data: promotedRecruits, error: prError } = prRes;

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
    <section className="w-full pt-6">
      <Carousel
        opts={{
          align: "center",
          loop: true,
        }}
        className="w-full"
      >
        <CarouselContent className="w-full flex justify-start gap-0 -ml-0 pt-0 pb-0">
          {banners.map((banner, index) => (
            <CarouselItem
              key={banner.id}
              className="basis-[92%] md:basis-[48%] lg:basis-[40%] pl-2 md:pl-4"
            >
              <Link href={banner.link_url || "#"} className={banner.link_url ? "cursor-pointer" : "cursor-default"}>
                <div 
                  className="w-full aspect-[16/9] md:aspect-[21/9] overflow-hidden rounded-lg relative group isolate shadow-md ring-1 ring-black/5"
                >
                  <div className="absolute inset-0 z-0">
                    <Image 
                      src={banner.image_url || "/placeholder.jpg"}
                      alt={banner.title} 
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 40vw"
                      priority={index === 0}
                    />
                    {/* Stronger Gradient for Clarity */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-90" />
                  </div>

                  <div className="absolute bottom-0 left-0 w-full p-5 md:p-8 z-10 flex flex-col items-start justify-end h-full">
                    {banner.subtitle && (
                      <span className="inline-block px-2.5 py-1 mb-3 text-[10px] font-black tracking-widest text-white uppercase bg-white/20 backdrop-blur-md rounded-full border border-white/10 shadow-sm">
                        {banner.subtitle}
                      </span>
                    )}
                    
                    <h2 className="text-xl md:text-3xl font-black text-white leading-tight tracking-tight drop-shadow-lg max-w-2xl break-keep">
                      {banner.title}
                    </h2>
                    
                    {/* Description Hidden for Cleanliness */}
                  </div>
                </div>
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
