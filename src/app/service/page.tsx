import { Button } from "@/components/ui/button";
import Link from "next/link";
import { 
  CheckCircle2, 
  Globe, 
  Palette, 
  Users, 
  Rocket, 
  ShieldCheck, 
  Zap,
  ArrowRight
} from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "서비스 소개 | 바이브폴리오",
  description: "바이브폴리오는 전 세계 크리에이터들과 영감을 주고받으며 함께 성장하는 프리미엄 포트폴리오 커뮤니티입니다.",
  openGraph: {
    title: "서비스 소개 | 바이브폴리오",
    description: "바이브폴리오는 전 세계 크리에이터들과 영감을 주고받으며 함께 성장하는 프리미엄 포트폴리오 커뮤니티입니다.",
  }
};

export default function ServicePage() {
  return (
    <div className="min-h-screen bg-white font-sans selection:bg-green-100 selection:text-green-900">
      {/* Full-screen Hero Section with AI Video Background */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Video Background */}
        <div className="absolute inset-0 z-0">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
          >
            <source
              src="https://assets.mixkit.co/videos/preview/mixkit-digital-animation-of-a-human-brain-spinning-around-31032-large.mp4"
              type="video/mp4"
            />
          </video>
          {/* Subtle Overlay to make text readable */}
          <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px]"></div>
        </div>
        
        <div className="max-w-7xl mx-auto text-center relative z-10 px-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-50 border border-green-100 text-green-700 text-sm font-medium mb-8 animate-fade-in-up">
            <Rocket size={14} />
            <span>크리에이터의 새로운 무대, Vibefolio 1.0</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 mb-8 leading-[1.1] animate-fade-in-up animation-delay-200">
            당신의 모든 <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-500">영감</span>이<br />
            하나의 포트폴리오가 되는 순간.
          </h1>
          <p className="text-xl text-slate-600 mb-12 max-w-2xl mx-auto leading-relaxed animate-fade-in-up animation-delay-400">
            Vibefolio는 단순한 기록을 넘어, 전 세계 크리에이터들과 영감을 주고받으며 
            함께 성장하는 프리미엄 포트폴리오 커뮤니티입니다.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 animate-fade-in-up animation-delay-600">
            <Button asChild size="lg" className="h-14 px-8 bg-slate-900 hover:bg-slate-800 text-white rounded-full text-lg font-bold shadow-lg shadow-slate-200 transition-all hover:-translate-y-1">
              <Link href="/project/upload">지금 시작하기</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-14 px-8 rounded-full border-2 text-lg font-bold transition-all hover:bg-slate-50 hover:-translate-y-1">
              <Link href="/faq">사용 방법 알아보기</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Philosophy Section */}
      <section className="py-32 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-sm font-bold text-green-600 tracking-widest uppercase mb-4">Our Values</h2>
            <h3 className="text-4xl font-bold text-slate-900">우리가 추구하는 가치</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="group bg-white p-10 rounded-3xl border border-slate-100 shadow-sm transition-all hover:shadow-xl hover:-translate-y-2">
              <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-green-600 transition-colors">
                <Palette className="w-7 h-7 text-green-600 group-hover:text-white transition-colors" />
              </div>
              <h4 className="text-2xl font-bold mb-4 text-slate-900">Creative Freedom</h4>
              <p className="text-slate-600 leading-relaxed text-lg">
                어떤 형식의 작품이라도 가장 돋보일 수 있는 레이아웃을 제공합니다. 
                기술적 제약 없이 당신의 감각을 온전히 표현하세요.
              </p>
            </div>
            
            <div className="group bg-white p-10 rounded-3xl border border-slate-100 shadow-sm transition-all hover:shadow-xl hover:-translate-y-2">
              <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-blue-600 transition-colors">
                <Users className="w-7 h-7 text-blue-600 group-hover:text-white transition-colors" />
              </div>
              <h4 className="text-2xl font-bold mb-4 text-slate-900">Collaborative Spirit</h4>
              <p className="text-slate-600 leading-relaxed text-lg">
                혼자보다는 함께일 때 더 멀리 갑니다. 전 세계 아티스트들과 소통하며 
                새로운 프로젝트 기회를 열어보세요.
              </p>
            </div>
            
            <div className="group bg-white p-10 rounded-3xl border border-slate-100 shadow-sm transition-all hover:shadow-xl hover:-translate-y-2">
              <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-purple-600 transition-colors">
                <Zap className="w-7 h-7 text-purple-600 group-hover:text-white transition-colors" />
              </div>
              <h4 className="text-2xl font-bold mb-4 text-slate-900">Infinite Insight</h4>
              <p className="text-slate-600 leading-relaxed text-lg">
                당신의 취향을 분석하여 매일 새로운 영감을 배달합니다. 
                데이터 기반의 큐레이션으로 감각을 확장하세요.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Showcase */}
      <section className="py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-20">
            <div className="lg:w-1/2">
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-tr from-green-400 to-blue-500 rounded-3xl blur-2xl opacity-20 animate-pulse"></div>
                <img 
                  src="https://images.unsplash.com/photo-1542744094-3a31f272c490?auto=format&fit=crop&q=80" 
                  alt="Feature Showcase" 
                  className="relative rounded-3xl shadow-2xl border border-slate-100"
                />
              </div>
            </div>
            <div className="lg:w-1/2">
              <h2 className="text-3xl font-bold mb-6">전문성 있는 작업 관리를 위한<br />모든 도구를 갖췄습니다.</h2>
              <ul className="space-y-6">
                {[
                  { title: "고성능 이미지 렌더링", desc: "대용량 고해상도 이미지도 끊김 없이 로딩됩니다." },
                  { title: "커스텀 포트폴리오 구성", desc: "나만의 스타일로 페이지를 꾸미고 관리하세요." },
                  { title: "글로벌 검색 도구", desc: "태그와 카테고리를 통해 전 세계 작품을 탐색하세요." },
                  { title: "안전한 데이터 보안", desc: "창작자의 소중한 권리와 데이터를 철저히 보호합니다." }
                ].map((item, idx) => (
                  <li key={idx} className="flex gap-4">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center mt-1">
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">{item.title}</h4>
                      <p className="text-slate-500">{item.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="py-32 px-6 bg-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-green-500 rounded-full mix-blend-screen filter blur-[150px] animate-pulse"></div>
        </div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-8">
            지금 Vibefolio의 일원이 되어<br />
            당신의 영감을 증명하세요.
          </h2>
          <p className="text-slate-400 text-lg mb-12">
            이미 5,000명 이상의 크리에이터가 Vibefolio와 함께하고 있습니다.
          </p>
          <Button asChild size="lg" className="h-16 px-12 bg-green-600 hover:bg-green-500 text-white rounded-full text-xl font-bold transition-all hover:scale-105 active:scale-95">
            <Link href="/signup">무료로 시작하기 <ArrowRight className="ml-2" /></Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
