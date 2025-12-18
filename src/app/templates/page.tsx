// src/app/templates/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ExternalLink, Loader2, Eye, Heart } from "lucide-react";

// 템플릿 카테고리
const TEMPLATE_CATEGORIES = [
  { id: "all", name: "전체", color: "bg-gray-100" },
  { id: "landing", name: "랜딩페이지", color: "bg-blue-100" },
  { id: "ecommerce", name: "이커머스", color: "bg-green-100" },
  { id: "business", name: "비즈니스", color: "bg-orange-100" },
  { id: "lifestyle", name: "라이프스타일", color: "bg-pink-100" },
  { id: "education", name: "교육", color: "bg-purple-100" },
  { id: "food", name: "F&B", color: "bg-cyan-100" },
];

// 실제 템플릿 데이터
const TEMPLATES = [
  {
    id: 1,
    title: "SweetSpot",
    category: "food",
    preview_image: "/templates/sweetspot.png",
    description: "달콤한 도넛샵을 위한 감성적인 템플릿",
    views: 1234,
    likes: 89,
    tags: ["도넛", "디저트", "파스텔"],
  },
  {
    id: 2,
    title: "CodeAcademy",
    category: "education",
    preview_image: "/templates/codeacademy.png",
    description: "코딩 교육 부트캠프를 위한 프로페셔널 템플릿",
    views: 2567,
    likes: 156,
    tags: ["개발", "교육", "테크"],
  },
  {
    id: 3,
    title: "Little Star",
    category: "education",
    preview_image: "/templates/littlestar.png",
    description: "아이들을 위한 밝고 즐거운 교육 템플릿",
    views: 987,
    likes: 67,
    tags: ["키즈", "교육", "영어"],
  },
  {
    id: 4,
    title: "Grand Hotel",
    category: "lifestyle",
    preview_image: "/templates/grandhotel.png",
    description: "럭셔리 호텔을 위한 우아한 템플릿",
    views: 3421,
    likes: 245,
    tags: ["호텔", "럭셔리", "다크"],
  },
  {
    id: 5,
    title: "Flower & Garden",
    category: "ecommerce",
    preview_image: "/templates/flowergarden.png",
    description: "플라워샵을 위한 내추럴한 템플릿",
    views: 1876,
    likes: 134,
    tags: ["꽃", "가든", "내추럴"],
  },
  {
    id: 6,
    title: "Yoga Flow",
    category: "lifestyle",
    preview_image: "/templates/yogaflow.png",
    description: "요가 스튜디오를 위한 평온한 템플릿",
    views: 1543,
    likes: 112,
    tags: ["요가", "웰니스", "힐링"],
  },
  {
    id: 7,
    title: "법무법인 정의",
    category: "business",
    preview_image: "/templates/lawfirm.png",
    description: "법률사무소를 위한 신뢰감 있는 템플릿",
    views: 2134,
    likes: 178,
    tags: ["로펌", "법률", "전문직"],
  },
  {
    id: 8,
    title: "Tax Partner",
    category: "business",
    preview_image: "/templates/taxpartner.png",
    description: "세무/회계사무소를 위한 깔끔한 템플릿",
    views: 1765,
    likes: 145,
    tags: ["세무", "회계", "컨설팅"],
  },
  {
    id: 9,
    title: "Cozy Stay",
    category: "lifestyle",
    preview_image: "/templates/cozystay.png",
    description: "펜션/리조트를 위한 따뜻한 감성 템플릿",
    views: 2890,
    likes: 234,
    tags: ["펜션", "숙소", "여행"],
  },
  {
    id: 10,
    title: "Novus",
    category: "landing",
    preview_image: "/templates/novus.png",
    description: "SaaS 제품을 위한 모던 다크 템플릿",
    views: 4123,
    likes: 312,
    tags: ["SaaS", "스타트업", "다크"],
  },
  {
    id: 11,
    title: "Minimal",
    category: "ecommerce",
    preview_image: "/templates/minimal.png",
    description: "미니멀 패션 브랜드를 위한 심플 템플릿",
    views: 3567,
    likes: 267,
    tags: ["패션", "미니멀", "화이트"],
  },
  {
    id: 12,
    title: "L'Atelier",
    category: "ecommerce",
    preview_image: "/templates/latelier.png",
    description: "럭셔리 가죽 제품 브랜드 템플릿",
    views: 2345,
    likes: 189,
    tags: ["가죽", "럭셔리", "핸드메이드"],
  },
  {
    id: 13,
    title: "SaladGreen",
    category: "food",
    preview_image: "/templates/saladgreen.png",
    description: "건강한 샐러드 배달 서비스 템플릿",
    views: 1987,
    likes: 156,
    tags: ["샐러드", "헬시", "배달"],
  },
  {
    id: 14,
    title: "The Avenue",
    category: "ecommerce",
    preview_image: "/templates/theavenue.png",
    description: "프리미엄 패션 쇼핑몰 템플릿",
    views: 3890,
    likes: 298,
    tags: ["패션", "쇼핑", "프리미엄"],
  },
  {
    id: 15,
    title: "UrbanKicks",
    category: "ecommerce",
    preview_image: "/templates/urbankicks.png",
    description: "스트릿 스니커즈 브랜드 템플릿",
    views: 4567,
    likes: 345,
    tags: ["스니커즈", "스트릿", "네온"],
  },
];

export default function TemplatesPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => setLoading(false), 300);
  }, []);

  const filteredTemplates = TEMPLATES.filter((template) => {
    const matchesSearch = template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === "all" || template.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 히어로 섹션 */}
      {/* 히어로 섹션 */}
      <section className="bg-gradient-to-br from-[#16A34A] to-[#84CC16] text-white py-20">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            프리미엄 디자인 템플릿
          </h1>
          <p className="text-lg md:text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            AI 시대의 창작자들을 위한 고품질 디자인 템플릿을 만나보세요.
            <br />
            바이브코딩으로 쉽게 커스터마이징하고 나만의 웹사이트를 만들 수 있습니다.
          </p>
          
          {/* 검색 */}
          <div className="max-w-xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <Input
              type="text"
              placeholder="템플릿 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-6 text-gray-900 text-lg rounded-xl border-0 shadow-lg"
            />
          </div>
        </div>
      </section>

      {/* 카테고리 필터 (헤더 높이 80px 고려하여 top-20) */}
      <section className="bg-white border-b sticky top-20 z-30 transition-all">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex gap-3 overflow-x-auto pb-2">
            {TEMPLATE_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === cat.id
                    ? "bg-[#16A34A] text-white shadow-md shadow-green-500/20"
                    : `${cat.color} text-gray-700 hover:bg-gray-200`
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 템플릿 그리드 */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <p className="text-gray-600">
            {filteredTemplates.length}개의 템플릿
          </p>
          <select className="px-4 py-2 border rounded-lg text-sm">
            <option>인기순</option>
            <option>최신순</option>
            <option>조회순</option>
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin" size={40} />
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">검색 결과가 없습니다.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredTemplates.map((template) => (
              <Card 
                key={template.id} 
                className="group overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer"
              >
                {/* 프리뷰 이미지 */}
                <div className="relative aspect-[16/10] overflow-hidden">
                  <img
                    src={template.preview_image}
                    alt={template.title}
                    className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                  />
                  {/* 호버 오버레이 */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                    <Button size="sm" className="bg-white text-gray-900 hover:bg-gray-100">
                      <Eye size={16} className="mr-2" />
                      미리보기
                    </Button>
                    <Button size="sm" className="bg-[#16A34A] hover:bg-[#15803D] text-white border-0">
                      <ExternalLink size={16} className="mr-2" />
                      사용하기
                    </Button>
                  </div>
                </div>
                
                <CardContent className="p-5">
                  {/* 태그 */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {template.tags.slice(0, 3).map((tag) => (
                      <span 
                        key={tag} 
                        className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  
                  {/* 제목 & 설명 */}
                  <h3 className="font-semibold text-lg text-gray-900 mb-1">
                    {template.title}
                  </h3>
                  <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                    {template.description}
                  </p>
                  
                  {/* 통계 */}
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Eye size={14} />
                      {template.views.toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart size={14} />
                      {template.likes.toLocaleString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* CTA 섹션 */}
      <section className="bg-gradient-to-r from-gray-900 to-gray-800 text-white py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-4">
            나만의 템플릿을 공유해보세요
          </h2>
          <p className="text-gray-300 mb-8">
            바이브폴리오에서 당신의 디자인 템플릿을 판매하고 수익을 창출하세요.
          </p>
          <Button 
            size="lg" 
            className="bg-[#16A34A] hover:bg-[#15803D] text-white shadow-xl shadow-green-500/20"
            onClick={() => router.push("/submission")}
          >
            템플릿 등록하기
          </Button>
        </div>
      </section>
    </div>
  );
}
