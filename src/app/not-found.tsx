import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHouse, faArrowRight } from '@fortawesome/free-solid-svg-icons';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-white relative overflow-hidden">
      {/* 배경 장식 (성능 영향 없는 CSS 원) */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-100 rounded-full blur-[100px] opacity-50 -z-10 animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-teal-100 rounded-full blur-[80px] opacity-50 -z-10" />

      <div className="text-center space-y-8 z-10 max-w-lg">
        {/* 404 타이포그래피 */}
        <div className="relative">
          <h1 className="text-[150px] md:text-[200px] font-black leading-none tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-[#6A5ACD] to-[#00FFC2] opacity-20 select-none">
            404
          </h1>
          <div className="absolute inset-0 flex items-center justify-center">
             <span className="text-2xl md:text-3xl font-bold text-gray-900 bg-white/80 px-4 py-2 rounded-full backdrop-blur-sm shadow-sm border border-gray-100">
               Page Not Found
             </span>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
            길을 잃으셨나요?
          </h2>
          <p className="text-gray-500 text-lg">
            찾으시는 페이지가 삭제되었거나 주소가 변경된 것 같습니다.<br className="hidden md:block"/>
            하지만 걱정 마세요, 영감은 어디에나 있으니까요!
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Button asChild className="btn-primary rounded-full px-8 py-6 text-base shadow-lg shadow-purple-500/20 w-full sm:w-auto">
            <Link href="/" className="flex items-center gap-2">
              <FontAwesomeIcon icon={faHouse} className="w-4 h-4" />
              <span>홈으로 돌아가기</span>
            </Link>
          </Button>
          <Button asChild variant="outline" className="rounded-full px-8 py-6 text-base hover:bg-gray-50 border-gray-200 w-full sm:w-auto">
            <Link href="/recruit" className="flex items-center gap-2">
              <span>새로운 영감 찾기</span>
              <FontAwesomeIcon icon={faArrowRight} className="w-3 h-3" />
            </Link>
          </Button>
        </div>
      </div>
      
      {/* 하단 브랜드 슬로건 */}
      <div className="absolute bottom-8 left-0 right-0 text-center text-sm text-gray-400 font-medium">
        VIBEFOLIO — Where Inspiration Sparks
      </div>
    </div>
  );
}
