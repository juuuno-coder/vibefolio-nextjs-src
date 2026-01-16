// src/app/tools/opportunity/page.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Search, 
  Sparkles, 
  ExternalLink,
  Loader2,
  Calendar,
  Building,
  MapPin,
  Bot
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase/client";

const CATEGORIES = [
  { id: 'opportunity', label: '🔭 기회 탐색', desc: '전국의 공모전, 해커톤, 대외활동을 찾아드립니다.', placeholder: '예: 카카오 공모전, 대학생 해커톤...' },
  { id: 'job', label: '💼 AI 채용', desc: '프롬프트 엔지니어, AI 아티스트 등 새로운 기회를 잡으세요.', placeholder: '예: 프롬프트 엔지니어, 영상 편집...' },
  { id: 'trend', label: '📰 트렌드', desc: '놓치면 안 될 최신 AI 기술 뉴스와 인사이트를 요약해드립니다.', placeholder: '예: Sora, ChatGPT 5, LLM 트렌드...' },
  { id: 'recipe', label: '👨‍🍳 레시피', desc: '원하는 스타일의 이미지 생성 프롬프트와 워크플로우를 알려드립니다.', placeholder: '예: 사이버펑크 스타일, 수채화풍 로고...' },
  { id: 'tool', label: '🛠️ 도구 추천', desc: '작업 목적에 딱 맞는 최고의 AI 도구를 추천해드립니다.', placeholder: '예: 배경 제거, 동영상 업스케일링, 목소리 변조...' },
];

export default function OpportunityFinderPage() {
  const [keyword, setKeyword] = useState("");
  const [activeTab, setActiveTab] = useState("opportunity");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!keyword.trim()) return;

    setLoading(true);
    setSearched(true);
    setResults([]);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      const res = await fetch('/api/tools/search-opportunity', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            ...(session ? { 'Authorization': `Bearer ${session.access_token}` } : {})
        },
        body: JSON.stringify({ keyword, category: activeTab })
      });

      const data = await res.json();
      if (data.success) {
        setResults(data.items);
      }
    } catch (error) {
      console.error("Search failed", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (id: string) => {
    setActiveTab(id);
    setSearched(false);
    setResults([]);
    setKeyword(""); // Clear keyword when changing tabs for UX clarity
  };

  const currentCategory = CATEGORIES.find(c => c.id === activeTab);

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Header Section */}
        <div className="text-center mb-10">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex justify-center mb-4"
          >
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-3 rounded-2xl shadow-lg">
              <Bot className="w-8 h-8 text-white" />
            </div>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl font-bold text-gray-900 mb-2"
          >
            Vibefolio AI Intelligence
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-gray-500"
          >
            크리에이터를 위한 AI 인텔리전스 엔진
          </motion.p>
        </div>

        {/* Categories (Tabs) */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
            {CATEGORIES.map((cat) => (
                <button
                key={cat.id}
                onClick={() => handleTabChange(cat.id)}
                className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-200 ${
                    activeTab === cat.id 
                    ? 'bg-gray-900 text-white shadow-lg transform scale-105' 
                    : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-200 hover:border-gray-300'
                }`}
                >
                {cat.label}
                </button>
            ))}
        </div>

        <div className="text-center mb-6 min-h-[1.5rem]">
            <p className="text-lg text-gray-700 font-medium animate-fade-in">
                {currentCategory?.desc}
            </p>
        </div>

        {/* Search Bar */}
        <Card className="mb-12 shadow-xl border-none bg-white/80 backdrop-blur">
          <CardContent className="p-4">
            <div className="flex gap-4 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input 
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder={currentCategory?.placeholder}
                  className="pl-12 h-14 text-lg bg-transparent border-gray-200 focus:ring-2 focus:ring-blue-500 rounded-xl"
                />
              </div>
              <Button 
                onClick={handleSearch}
                disabled={loading || !keyword.trim()}
                className="h-14 px-8 text-lg font-medium bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl shadow-md transition-all hover:scale-105"
              >
                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "검색하기"}
              </Button>
            </div>
            {/* Cost Info Tooltip */}
            <div className="mt-3 text-center text-xs text-gray-400">
               * AI 검색은 '해보자고' MCP 엔진을 사용하며, 실시간 외부 데이터를 수집합니다.
            </div>
          </CardContent>
        </Card>

        {/* Results Section */}
        <div className="space-y-6">
          {loading && (
            <div className="text-center py-20">
              <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
              <p className="text-gray-500 text-lg animate-pulse">
                AI가 정보를 수집하고 분석 중입니다...<br/>
                <span className="text-sm">(Engine: Haebojago MCP)</span>
              </p>
            </div>
          )}

          {!loading && searched && results.length === 0 && (
            <div className="text-center py-20 bg-white rounded-3xl shadow-sm">
              <span className="text-6xl mb-4 block">😅</span>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">검색 결과가 없습니다</h3>
              <p className="text-gray-500">
                다른 키워드로 검색해보시는 건 어떨까요?
              </p>
            </div>
          )}

          <AnimatePresence>
            {!loading && results.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card className="overflow-hidden hover:shadow-lg transition-shadow border-gray-100 group">
                  <div className="flex flex-col md:flex-row">
                    
                    {/* Content Section */}
                    <div className="flex-1 p-6 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                            {item.title}
                          </h3>
                          <span className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full font-medium shrink-0 ml-2 uppercase">
                            {item.type || activeTab}
                          </span>
                        </div>
                        
                        <div className="text-sm text-gray-600 mb-4 whitespace-pre-wrap leading-relaxed">
                          {item.description}
                        </div>

                        {/* Metadata Row */}
                        <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-4">
                          {item.company && item.company !== 'Unknown' && item.company !== 'MCP Intelligence' && (
                            <div className="flex items-center gap-1.5 font-medium text-gray-700">
                              <Building className="w-4 h-4" />
                              {item.company}
                            </div>
                          )}
                          {item.date && (
                             <div className="flex items-center gap-1.5">
                                <Calendar className="w-4 h-4" />
                                {item.date}
                             </div>
                          )}
                          {item.location && item.location !== 'Online' && (
                             <div className="flex items-center gap-1.5">
                                <MapPin className="w-4 h-4" />
                                {item.location}
                             </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-gray-50 mt-auto">
                        <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded">
                           출처: {item.sourceUrl?.includes('haebojago') ? '✨ 해보자고(MCP)' : 'Vibefolio'}
                        </span>
                        
                        {item.link && (
                            <a 
                            href={item.link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-blue-600 font-semibold hover:text-blue-800 transition-colors"
                            >
                            자세히 보기 <ExternalLink className="w-4 h-4" />
                            </a>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
