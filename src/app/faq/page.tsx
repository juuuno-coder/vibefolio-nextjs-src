"use client";

import { useEffect, useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { supabase } from "@/lib/supabase/client";
import { Loader2, Search, HelpCircle, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface FAQ {
  id: number;
  category: string;
  question: string;
  answer: string;
}

const CATEGORIES = ["전체", "서비스 이용", "계정 관리", "프로젝트", "운영 정책", "문의"];

export default function FAQPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [filteredFaqs, setFilteredFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("전체");

  useEffect(() => {
    async function loadFaqs() {
      try {
        const { data, error } = await supabase
          .from("faqs")
          .select("*")
          .eq("is_visible", true)
          .order("order_index", { ascending: true });

        if (error) throw error;
        
        // DB에 데이터가 없으면 기본 FAQ 사용
        if (!data || data.length === 0) {
          const defaultFaqs: FAQ[] = [
            { id: 1, category: "서비스 이용", question: "Vibefolio는 어떤 서비스인가요?", answer: "Vibefolio는 크리에이터들이 자신의 포트폴리오를 공유하고, 전 세계 아티스트들과 소통하며 영감을 주고받을 수 있는 프리미엄 포트폴리오 커뮤니티입니다." },
            { id: 2, category: "계정 관리", question: "회원가입은 어떻게 하나요?", answer: "우측 상단의 '회원가입' 버튼을 클릭하거나, Google 계정으로 간편하게 가입하실 수 있습니다." },
            { id: 3, category: "프로젝트", question: "프로젝트는 어떻게 업로드하나요?", answer: "로그인 후 '프로젝트 등록' 버튼을 클릭하여 이미지, 제목, 설명 등을 입력하고 업로드하실 수 있습니다." },
            { id: 4, category: "프로젝트", question: "어떤 형식의 파일을 업로드할 수 있나요?", answer: "JPG, PNG, GIF 등의 이미지 파일을 지원하며, 최대 10MB까지 업로드 가능합니다." },
            { id: 5, category: "운영 정책", question: "저작권은 어떻게 보호되나요?", answer: "업로드된 모든 작품의 저작권은 창작자에게 있으며, 무단 도용 시 법적 조치가 가능합니다." },
            { id: 6, category: "문의", question: "문의는 어떻게 하나요?", answer: "하단의 '1:1 문의하기' 버튼을 통해 언제든지 문의하실 수 있으며, 24시간 내에 답변드립니다." },
          ];
          setFaqs(defaultFaqs);
          setFilteredFaqs(defaultFaqs);
        } else {
          setFaqs(data);
          setFilteredFaqs(data);
        }
      } catch (e) {
        console.error("FAQ Load Error:", e);
        // 에러 발생 시에도 기본 FAQ 표시
        const defaultFaqs: FAQ[] = [
          { id: 1, category: "서비스 이용", question: "Vibefolio는 어떤 서비스인가요?", answer: "Vibefolio는 크리에이터들이 자신의 포트폴리오를 공유하고, 전 세계 아티스트들과 소통하며 영감을 주고받을 수 있는 프리미엄 포트폴리오 커뮤니티입니다." },
          { id: 2, category: "계정 관리", question: "회원가입은 어떻게 하나요?", answer: "우측 상단의 '회원가입' 버튼을 클릭하거나, Google 계정으로 간편하게 가입하실 수 있습니다." },
          { id: 3, category: "프로젝트", question: "프로젝트는 어떻게 업로드하나요?", answer: "로그인 후 '프로젝트 등록' 버튼을 클릭하여 이미지, 제목, 설명 등을 입력하고 업로드하실 수 있습니다." },
        ];
        setFaqs(defaultFaqs);
        setFilteredFaqs(defaultFaqs);
      } finally {
        setLoading(false);
      }
    }
    loadFaqs();
  }, []);

  useEffect(() => {
    let result = faqs;

    if (selectedCategory !== "전체") {
      result = result.filter(f => f.category === selectedCategory);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(f => 
        f.question.toLowerCase().includes(term) || 
        f.answer.toLowerCase().includes(term)
      );
    }

    setFilteredFaqs(result);
  }, [selectedCategory, searchTerm, faqs]);

  return (
    <div className="min-h-screen bg-slate-50 py-20 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-2xl mb-6">
            <HelpCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 mb-4">자주 묻는 질문</h1>
          <p className="text-lg text-slate-600 max-w-xl mx-auto">
            Vibefolio 이용 중 궁금한 점이 있으신가요? 
            분야별로 정리된 답변을 통해 궁금증을 해결해 보세요.
          </p>
        </div>

        {/* Search & Filter */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 mb-10">
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <Input 
              placeholder="궁금한 내용을 입력해 보세요 (예: 비밀번호 찾기, 업로드 등)"
              className="pl-12 h-14 rounded-2xl border-slate-200 text-lg focus:ring-green-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${
                  selectedCategory === cat 
                    ? "bg-slate-900 text-white shadow-md shadow-slate-200" 
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* FAQ List */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-24 text-slate-400">
              <Loader2 className="animate-spin mr-2" size={24} /> 
              <span>데이터를 불러오는 중입니다...</span>
            </div>
          ) : filteredFaqs.length > 0 ? (
            <Accordion type="single" collapsible className="w-full">
              {filteredFaqs.map((faq, idx) => (
                <AccordionItem 
                  key={faq.id} 
                  value={`item-${faq.id}`}
                  className={`border-b border-slate-100 last:border-0`}
                >
                  <AccordionTrigger className="px-8 py-6 text-left hover:bg-slate-50 transition-all text-lg font-bold text-slate-900 group">
                    <span className="flex items-center gap-4">
                      <span className="text-green-600 font-mono text-sm group-hover:scale-110 transition-transform">
                        Q{idx + 1 < 10 ? `0${idx + 1}` : idx + 1}
                      </span>
                      {faq.question}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="px-12 py-8 bg-slate-50 text-slate-600 leading-relaxed text-lg border-t border-slate-100 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex gap-4">
                      <span className="text-blue-600 font-mono font-bold text-sm pt-1">A.</span>
                      <p className="whitespace-pre-wrap">{faq.answer}</p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <div className="text-center py-24">
              <p className="text-slate-400 text-lg mb-6">검색 결과가 없습니다.</p>
              <Button asChild variant="outline" onClick={() => {setSearchTerm(""); setSelectedCategory("전체");}}>
                <span>검색 조건 초기화</span>
              </Button>
            </div>
          )}
        </div>

        {/* Extra Help */}
        <div className="mt-16 bg-gradient-to-r from-green-600 to-emerald-500 rounded-3xl p-10 text-white text-center">
          <h3 className="text-2xl font-bold mb-4">원하시는 답변을 찾지 못하셨나요?</h3>
          <p className="opacity-90 mb-8 max-w-lg mx-auto">
            Vibefolio 고객센터는 언제나 열려있습니다. 
            1:1 문의를 남겨주시면 담당자가 신속하게 도와드리겠습니다.
          </p>
          <Button asChild size="lg" className="bg-white text-green-700 hover:bg-slate-100 rounded-full font-bold px-8">
            <Link href="/contact" className="flex items-center gap-2">
              1:1 문의하기 <ArrowRight size={18} />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
