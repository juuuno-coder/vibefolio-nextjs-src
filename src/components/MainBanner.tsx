// src/components/MainBanner.tsx

// 🚨 캐러셀은 상호작용이 필요한 컴포넌트이므로 클라이언트 컴포넌트로 지정합니다.
"use client";

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

// 🚨 컴포넌트 Props 타입 정의
interface MainBannerProps {
  // 🚨 타입 이름 AppMainBannerProps -> MainBannerProps로 변경
  loading: boolean;
  // 임시 타입: 갤러리 항목은 배열이어야 하지만, 실제 데이터 스키마에 맞게 수정해야 합니다.
  gallery: unknown[];
}

export function MainBanner({ loading, gallery }: MainBannerProps) {
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
          {loading ? (
            <>
              <Skeleton className="min-w-[90vw] md:min-w-[600px] w-[90vw] md:w-[600px] h-[300px] md:h-[400px]" />
              <Skeleton className="min-w-[90vw] md:min-w-[600px] w-[90vw] md:w-[600px] h-[300px] md:h-[400px]" />
              <Skeleton className="min-w-[90vw] md:min-w-[600px] w-[90vw] md:w-[600px] h-[300px] md:h-[400px]" />
            </>
          ) : (
            (gallery.length > 0 ? gallery : [1, 2, 3]).map((_, index) => (
              <CarouselItem
                key={index}
                className="basis-[90vw] md:basis-[600px] pl-4"
              >
                <Card className="w-full h-[300px] md:h-[400px] overflow-hidden hover:shadow-lg transition-shadow duration-300">
                  <CardContent className="flex items-center justify-center h-full bg-gradient-to-br from-[#4ACAD4] to-[#05BCC6] relative">
                    <span className="text-6xl md:text-8xl font-bold text-white/30">{index + 1}</span>
                    <div className="absolute bottom-4 right-4 bg-white/90 px-4 py-2 rounded-lg">
                      <p className="text-sm text-gray-600">배너 {index + 1}</p>
                    </div>
                  </CardContent>
                </Card>
              </CarouselItem>
            ))
          )}
        </CarouselContent>
        <CarouselPrevious className="left-4 rounded-full hidden md:flex" />
        <CarouselNext className="right-4 rounded-full hidden md:flex" />
      </Carousel>
    </section>
  );
}

// 🚨 익스포트 이름 AppMainBanner -> MainBanner로 변경
export default MainBanner;
