// src/app/recruit/page.tsx
import { Metadata } from 'next';
import RecruitPageClient from "@/components/recruit/RecruitPageClient";

export const metadata: Metadata = {
  title: "AI 채용 & 공모전 | Vibefolio",
  description: "최신 생성형 AI 공모전, 해커톤, 개발자 채용 소식을 실시간으로 확인하고 도전하세요.",
  keywords: ["AI 공모전", "해커톤", "생성형 AI", "개발자 채용", "디자이너 채용", "Vibefolio"],
  openGraph: {
    title: "AI 채용 & 공모전 - Vibefolio",
    description: "크리에이터를 위한 최신 AI 소식 및 구인 구직 정보",
    url: "https://vibefolio.net/recruit",
    siteName: 'Vibefolio',
    images: [{
      url: "/images/recruit-banner.jpg",
      width: 1200,
      height: 630,
      alt: "Vibefolio Recruit"
    }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI 채용 & 공모전 - Vibefolio",
    description: "최신 AI 트렌드와 기회를 한눈에 확인하세요",
    images: ["/images/recruit-banner.jpg"],
  }
};

export default function RecruitPage() {
  return <RecruitPageClient />;
}
