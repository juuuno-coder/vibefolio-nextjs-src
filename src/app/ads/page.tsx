"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Check, Zap, BarChart3, Clock, ArrowRight } from "lucide-react";

export default function AdsPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <section className="bg-slate-900 text-white pt-24 pb-32 px-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&q=80')] bg-cover bg-center" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <Badge className="mb-6 bg-blue-600 hover:bg-blue-700 px-4 py-1 text-sm">
            Vibefolio Ads
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            압도적인 노출,<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
              단 한 번의 결제로 영원히.
            </span>
          </h1>
          <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto leading-relaxed">
            매월 나가는 광고비가 부담스러우신가요?<br />
            Vibefolio는 게시 종료를 원하실 때까지, 추가 비용 없이 귀사의 브랜드를 메인 상단에 노출해 드립니다.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="text-lg px-8 py-6 bg-white text-slate-900 hover:bg-slate-200">
              <Link href="/contact?title=[광고문의] 프리미엄 상단 배너 광고 신청">
                광고 상담 신청하기 <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Product Section */}
      <section className="py-20 px-6 -mt-20 relative z-20">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100 flex flex-col md:flex-row">
            {/* Left: Product Info */}
            <div className="p-8 md:p-12 md:w-2/3">
              <h2 className="text-3xl font-bold mb-6 text-slate-900">Premium Top Banner</h2>
              <p className="text-slate-600 mb-8 text-lg">
                Vibefolio 메인 페이지 최상단, 가장 눈에 띄는 자리에 귀사의 배너가 고정됩니다. 
                디자이너, 기획자, 개발자 등 크리에이티브 업계 종사자들에게 확실하게 각인시킬 수 있는 기회입니다.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Zap className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">최상단 독점 노출</h4>
                    <p className="text-sm text-slate-500 mt-1">메인 접속 시 가장 먼저 보이는 영역</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <BarChart3 className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">명확한 타겟팅</h4>
                    <p className="text-sm text-slate-500 mt-1">크리에이티브 전문가 집중 타겟</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                    <Clock className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">기간 무제한</h4>
                    <p className="text-sm text-slate-500 mt-1">1회 결제로 평생 게시 (종료 희망 시까지)</p>
                  </div>
                </div>
               </div>
            </div>

            {/* Right: Pricing & CTA */}
            <div className="bg-slate-50 p-8 md:p-12 md:w-1/3 flex flex-col justify-center border-l border-slate-100">
              <div className="mb-6">
                <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Early Bird Offer</span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-4xl font-bold text-slate-900">별도 협의</span>
                </div>
                <p className="text-sm text-slate-500 mt-2">일회성 결제 (One-time payment)</p>
              </div>
              
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-2 text-sm text-slate-700">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>배너 제작 가이드 제공</span>
                </li>
                <li className="flex items-center gap-2 text-sm text-slate-700">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>링크 연결 지원</span>
                </li>
                <li className="flex items-center gap-2 text-sm text-slate-700">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>성과 리포트 제공 (요청 시)</span>
                </li>
              </ul>

              <Button asChild className="w-full bg-slate-900 hover:bg-slate-800">
                <Link href="/contact?title=[광고문의] 프리미엄 상단 배너 광고 문의">
                  지금 문의하기
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-20 px-6 max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-16">광고 집행 프로세스</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
          {/* Connector Line (Desktop) */}
          <div className="hidden md:block absolute top-8 left-[12.5%] right-[12.5%] h-0.5 bg-slate-200 -z-10" />

          {[
            { step: "01", title: "문의 접수", desc: "문의 양식을 통해 광고 상담을 신청해주세요." },
            { step: "02", title: "상담 및 견적", desc: "담당자가 배정되어 일정 및 견적을 안내드립니다." },
            { step: "03", title: "결제 및 자료 전달", desc: "비용 결제 후 배너 이미지를 전달주세요." },
            { step: "04", title: "광고 게시", desc: "검수 후 즉시 광고가 라이브됩니다." },
          ].map((item, idx) => (
            <div key={idx} className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm text-center">
              <div className="w-12 h-12 bg-white border-2 border-primary text-primary rounded-full flex items-center justify-center font-bold mx-auto mb-4 text-lg">
                {item.step}
              </div>
              <h3 className="font-bold text-lg mb-2">{item.title}</h3>
              <p className="text-sm text-slate-500">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
