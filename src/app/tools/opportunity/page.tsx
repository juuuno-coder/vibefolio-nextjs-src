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

export default function OpportunityFinderPage() {
  const [keyword, setKeyword] = useState("");
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
        body: JSON.stringify({ keyword })
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

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Header Section */}
        <div className="text-center mb-12">
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
            className="text-4xl font-bold text-gray-900 mb-4"
          >
            AI 공모전 탐색기
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg text-gray-600 max-w-2xl mx-auto"
          >
            "카카오 공모전", "대학생 디자인 해커톤" 같이 물어보세요.<br/>
            <strong>해보자고(MCP)</strong> 인공지능이 숨겨진 기회까지 찾아드립니다.
          </motion.p>
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
                  placeholder="예: 서울 대학생 봉사활동, 삼성전자 아이디어 공모전, AI 해커톤..." 
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
            {/* Cost Info Tooltip equivalent */}
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
                AI가 전국 방방곡곡의 공모전을 찾고 있어요...<br/>
                <span className="text-sm">(위비티, 네이버 뉴스, 해보자고 엔진 가동 중)</span>
              </p>
            </div>
          )}

          {!loading && searched && results.length === 0 && (
            <div className="text-center py-20 bg-white rounded-3xl shadow-sm">
              <span className="text-6xl mb-4 block">😅</span>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">검색 결과가 없습니다</h3>
              <p className="text-gray-500">
                다른 키워드로 검색해보시는 건 어떨까요?<br/>
                예: "디자인 공모전", "대학생 마케터"
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
                    {/* Thumbnail Section */}
                    {item.image && (
                      <div className="w-full md:w-48 h-48 md:h-auto relative overflow-hidden bg-gray-100">
                         {/* eslint-disable-next-line @next/next/no-img-element */}
                         <img 
                           src={item.image} 
                           alt={item.title} 
                           className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                         />
                         <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
                            {item.company}
                         </div>
                      </div>
                    )}
                    
                    {/* Content Section */}
                    <div className="flex-1 p-6 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                            {item.title}
                          </h3>
                          {item.categoryTags?.includes('AI') && (
                            <span className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1 shrink-0 ml-2">
                              <Sparkles className="w-3 h-3" /> AI 추천
                            </span>
                          )}
                        </div>
                        
                        <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                          {item.description}
                        </p>

                        <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-4">
                          <div className="flex items-center gap-1.5">
                            <Building className="w-4 h-4" />
                            {item.company}
                          </div>
                          <div className="flex items-center gap-1.5">
                             <Calendar className="w-4 h-4" />
                             {item.date}
                          </div>
                          <div className="flex items-center gap-1.5">
                             <MapPin className="w-4 h-4" />
                             {item.location}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-gray-50 mt-auto">
                        <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded">
                           출처: {item.sourceUrl?.includes('haebojago') ? '✨ 해보자고(MCP)' : new URL(item.sourceUrl || 'https://vibefolio.com').hostname}
                        </span>
                        
                        <a 
                          href={item.link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-blue-600 font-semibold hover:text-blue-800 transition-colors"
                        >
                          자세히 보기 <ExternalLink className="w-4 h-4" />
                        </a>
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
