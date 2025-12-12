// src/components/MainBanner.tsx

"use client";

import { useEffect, useState } from "react";
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

interface MainBannerProps {
  pageType?: "discover" | "connect";
  loading?: boolean;
  gallery?: any[];
}

export function MainBanner({ pageType = "discover" }: MainBannerProps) {
  const [banners, setBanners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBanners = async () => {
      try {
        const res = await fetch(`/api/banners?pageType=${pageType}&activeOnly=true`);
        const data = await res.json();
        
        if (res.ok && data.banners) {
          setBanners(data.banners);
        }
      } catch (error) {
        console.error("배너 로드 실패:", error);
      } finally {
        setLoading(false);
      }
    };

    loadBanners();
  }, [pageType]);

  if (loading) {
    return (
      <section className="w-full">
        <Carousel className="w-full">
          <CarouselContent className="w-full flex justify-start gap-4 -ml-4">
            <Skeleton className="min-w-[90vw] md:min-w-[600px] w-[90vw] md:w-[600px] h-[300px] md:h-[400px]" />
            <Skeleton className="min-w-[90vw] md:min-w-[600px] w-[90vw] md:w-[600px] h-[300px] md:h-[400px]" />
            <Skeleton className="min-w-[90vw] md:min-w-[600px] w-[90vw] md:w-[600px] h-[300px] md:h-[400px]" />
          </CarouselContent>
        </Carousel>
      </section>
    );
  }

  if (banners.length === 0) {
    return null; // 배너가 없으면 표시하지 않음
  }

  return (
    <section className="w-full">
      <Carousel
        opts={{
          align: "start",
          loop: true,
        }}
        className="w-full"
      >
        <CarouselContent className="w-full flex justify-start gap-4 -ml-4">
          {banners.map((banner) => (
            <CarouselItem
              key={banner.banner_id}
              className="basis-[90vw] md:basis-[600px] pl-4"
            >
              <Card 
                className="w-full h-[300px] md:h-[400px] overflow-hidden hover:shadow-lg transition-shadow duration-300 cursor-pointer"
                onClick={() => {
                  if (banner.link_url) {
                    window.location.href = banner.link_url;
                  }
                }}
              >
                <CardContent className="flex items-center justify-center h-full p-0 relative">
                  <img
                    src={banner.image_url}
                    alt={banner.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-4 right-4 bg-white/90 px-4 py-2 rounded-lg">
                    <p className="text-sm text-gray-600">{banner.title}</p>
                  </div>
                </CardContent>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="left-4 rounded-full hidden md:flex" />
        <CarouselNext className="right-4 rounded-full hidden md:flex" />
      </Carousel>
    </section>
  );
}

export default MainBanner;
