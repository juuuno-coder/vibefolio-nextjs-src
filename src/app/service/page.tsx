"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import YouTube from "react-youtube";
import { 
  CheckCircle2, 
  Globe, 
  Palette, 
  Users, 
  Rocket, 
  ShieldCheck, 
  Zap,
  ArrowRight,
  Layout,
  BarChart3
} from "lucide-react";

export default function ServicePage() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const videoOptions = {
    playerVars: {
      autoplay: 1,
      controls: 0,
      rel: 0,
      showinfo: 0,
      mute: 1,
      loop: 1,
      playlist: "s3m2s0hu2DE", // Loop requires playlist with same ID
      modestbranding: 1,
      playsinline: 1,
    },
  };

  return (
    <div className="min-h-screen bg-white font-sans selection:bg-green-100 selection:text-green-900">
      {/* Full-screen Hero Section with YouTube Video Background */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden bg-slate-900">
        {/* YouTube Background Container */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          {isMounted && (
            <div className="absolute top-1/2 left-1/2 w-[100vw] h-[56.25vw] min-h-[100vh] min-w-[177.77vh] -translate-x-1/2 -translate-y-1/2 opacity-60">
              <YouTube
                videoId="s3m2s0hu2DE"
                opts={videoOptions}
                className="w-full h-full"
                iframeClassName="w-full h-full pointer-events-none"
                onReady={(event: any) => {
                  event.target.playVideo();
                }}
              />
            </div>
          )}
          {/* Gradient Overlay for Depth and Readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/40 via-transparent to-slate-900/80"></div>
        </div>
        
        <div className="max-w-7xl mx-auto text-center relative z-10 px-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-green-400 text-sm font-medium mb-8 backdrop-blur-md animate-fade-in-up">
            <Rocket size={16} />
            <span>크리에이터의 새로운 무대, Vibefolio 1.0</span>
          </div>
          <h1 className="text-5xl md:text-8xl font-black tracking-tight text-white mb-8 leading-[1.1] animate-fade-in-up animation-delay-200">
            당신의 모든 <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400">영감</span>이<br />
            하나의 포트폴리오가 되는 순간.
          </h1>
          <p className="text-xl md:text-2xl text-slate-200 mb-12 max-w-3xl mx-auto leading-relaxed animate-fade-in-up animation-delay-400 font-medium opacity-90">
            Vibefolio는 단순한 기록을 넘어, 전 세계 크리에이터들과 영감을 주고받으며 
            함께 성장하는 프리미엄 포트폴리오 커뮤니티입니다.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-6 animate-fade-in-up animation-delay-600">
            <Button asChild size="lg" className="h-16 px-10 bg-green-500 hover:bg-green-400 text-white rounded-full text-xl font-bold shadow-xl shadow-green-900/40 transition-all hover:-translate-y-1">
              <Link href="/project/upload">지금 시작하기</Link>
            </Button>
            <Button asChild size="lg" variant="ghost" className="h-16 px-10 rounded-full border-2 border-white/50 text-white text-xl font-bold transition-all hover:bg-white/20 hover:border-white hover:-translate-y-1 backdrop-blur-md bg-white/10 shadow-lg">
              <Link href="/faq">사용 방법 알아보기</Link>
            </Button>
          </div>
        </div>

        {/* Scroll down indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce text-white/50">
          <ArrowRight className="rotate-90 w-8 h-8" />
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

      {/* Major Features Section */}
      <section className="py-32 px-6 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-24">
             <span className="text-green-600 font-bold tracking-wider uppercase text-sm bg-green-50 px-3 py-1 rounded-full">Key Features</span>
             <h2 className="text-4xl md:text-5xl font-black text-slate-900 mt-6 leading-tight">
               상상을 현실로 만드는<br/>
               <span className="relative inline-block">
                 <span className="relative z-10">강력한 도구들</span>
                 <span className="absolute bottom-2 left-0 w-full h-3 bg-green-200/50 -rotate-1 z-0"></span>
               </span>
             </h2>
             <p className="mt-6 text-xl text-slate-500 max-w-2xl mx-auto">
               Vibefolio는 크리에이터가 오직 창작에만 집중할 수 있도록<br className="hidden md:block"/> 
               가장 진보된 기술과 환경을 제공합니다.
             </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-24">
             {/* Feature 1 */}
             <div className="group">
                <div className="relative aspect-[16/10] bg-slate-50 rounded-[40px] overflow-hidden shadow-sm border border-slate-100 mb-8 transition-all duration-500 group-hover:shadow-2xl group-hover:shadow-purple-500/10 group-hover:-translate-y-2">
                   <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-white to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                   
                   {/* Visual Placeholder */}
                   <div className="absolute inset-0 flex items-center justify-center">
                      <div className="relative">
                        <div className="absolute inset-0 bg-purple-400 blur-[60px] opacity-20 animate-pulse"></div>
                        <div className="w-32 h-32 bg-white rounded-[2rem] shadow-xl flex items-center justify-center relative z-10 border border-slate-50 group-hover:scale-110 transition-transform duration-500">
                          <Palette className="w-12 h-12 text-purple-600" strokeWidth={1.5} />
                        </div>
                        {/* Decor elements */}
                        <div className="absolute -top-8 -right-8 w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center shadow-md animate-bounce delay-100">
                          <Rocket className="w-6 h-6 text-blue-500" />
                        </div>
                        <div className="absolute -bottom-6 -left-8 w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center shadow-md animate-bounce delay-300">
                           <Layout className="w-6 h-6 text-green-600" />
                        </div>
                      </div>
                   </div>
                </div>
                <div className="px-4">
                   <h3 className="text-2xl font-bold text-slate-900 mb-3 flex items-center gap-3">
                     압도적인 에디팅 경험
                     <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-purple-500 group-hover:translate-x-1 transition-all" />
                   </h3>
                   <p className="text-slate-600 leading-relaxed text-lg">
                      이미지, 영상, 오디오는 물론 3D 모델과 코드 블록까지. 
                      드래그 앤 드롭으로 쉽고 자유롭게 당신의 이야기를 구성하세요. 
                      어떤 포맷이든 가장 완벽한 형태로 렌더링됩니다.
                   </p>
                </div>
             </div>

             {/* Feature 2: Staggered on Desktop */}
             <div className="group md:mt-24">
                <div className="relative aspect-[16/10] bg-slate-50 rounded-[40px] overflow-hidden shadow-sm border border-slate-100 mb-8 transition-all duration-500 group-hover:shadow-2xl group-hover:shadow-green-500/10 group-hover:-translate-y-2">
                   <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-white to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                   <div className="absolute inset-0 flex items-center justify-center">
                      <div className="relative">
                        <div className="absolute inset-0 bg-green-400 blur-[60px] opacity-20 animate-pulse"></div>
                        <div className="w-32 h-32 bg-white rounded-[2rem] shadow-xl flex items-center justify-center relative z-10 border border-slate-50 group-hover:scale-110 transition-transform duration-500">
                          <Globe className="w-12 h-12 text-green-600" strokeWidth={1.5} />
                        </div>
                         <div className="absolute top-1/2 -right-12 -translate-y-1/2 bg-white px-4 py-2 rounded-xl shadow-lg border border-slate-100 text-xs font-bold text-slate-600 animate-pulse delay-75">
                           Global Reach 🌍
                         </div>
                      </div>
                   </div>
                </div>
                <div className="px-4">
                   <h3 className="text-2xl font-bold text-slate-900 mb-3 flex items-center gap-3">
                     경계 없는 글로벌 네트워킹
                     <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-green-500 group-hover:translate-x-1 transition-all" />
                   </h3>
                   <p className="text-slate-600 leading-relaxed text-lg">
                      언어의 장벽 없이 전 세계 크리에이터와 연결됩니다. 
                      자동 번역 시스템과 글로벌 검색 최적화로 
                      당신의 작업물이 국경을 넘어 더 많은 팬들에게 닿을 수 있습니다.
                   </p>
                </div>
             </div>

             {/* Feature 3 */}
             <div className="group">
                <div className="relative aspect-[16/10] bg-slate-50 rounded-[40px] overflow-hidden shadow-sm border border-slate-100 mb-8 transition-all duration-500 group-hover:shadow-2xl group-hover:shadow-orange-500/10 group-hover:-translate-y-2">
                   <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-white to-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                   <div className="absolute inset-0 flex items-center justify-center">
                      <div className="relative">
                        <div className="absolute inset-0 bg-orange-400 blur-[60px] opacity-20 animate-pulse"></div>
                        <div className="w-32 h-32 bg-white rounded-[2rem] shadow-xl flex items-center justify-center relative z-10 border border-slate-50 group-hover:scale-110 transition-transform duration-500">
                          <Users className="w-12 h-12 text-orange-500" strokeWidth={1.5} />
                        </div>
                        {/* Chat bubbles */}
                        <div className="absolute -top-6 -right-4 w-12 h-10 bg-slate-800 rounded-lg flex items-center justify-center shadow-md pb-1">
                           <div className="w-2 h-2 bg-white rounded-full mx-0.5 animate-bounce"></div>
                           <div className="w-2 h-2 bg-white rounded-full mx-0.5 animate-bounce delay-100"></div>
                           <div className="w-2 h-2 bg-white rounded-full mx-0.5 animate-bounce delay-200"></div>
                        </div>
                        <div className="absolute -bottom-4 -left-6 w-auto px-4 py-2 bg-white rounded-full border border-slate-100 shadow-md text-xs font-bold text-red-500 flex items-center gap-1">
                           ♥ 2.8k
                        </div>
                      </div>
                   </div>
                </div>
                <div className="px-4">
                   <h3 className="text-2xl font-bold text-slate-900 mb-3 flex items-center gap-3">
                     함께 성장하는 커뮤니티
                     <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-orange-500 group-hover:translate-x-1 transition-all" />
                   </h3>
                   <p className="text-slate-600 leading-relaxed text-lg">
                      관심사가 비슷한 동료를 팔로우하고 피드백을 주고받으세요. 
                      실시간 알림과 1:1 메시징을 통해 소중한 인연을 만들고, 
                      새로운 협업 기회를 발견할 수 있습니다.
                   </p>
                </div>
             </div>

             {/* Feature 4: Staggered on Desktop */}
             <div className="group md:mt-24">
                <div className="relative aspect-[16/10] bg-slate-50 rounded-[40px] overflow-hidden shadow-sm border border-slate-100 mb-8 transition-all duration-500 group-hover:shadow-2xl group-hover:shadow-blue-500/10 group-hover:-translate-y-2">
                   <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-white to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                   <div className="absolute inset-0 flex items-center justify-center">
                      <div className="relative">
                        <div className="absolute inset-0 bg-blue-400 blur-[60px] opacity-20 animate-pulse"></div>
                        <div className="w-32 h-32 bg-white rounded-[2rem] shadow-xl flex items-center justify-center relative z-10 border border-slate-50 group-hover:scale-110 transition-transform duration-500">
                          <BarChart3 className="w-12 h-12 text-blue-600" strokeWidth={1.5} />
                        </div>
                        {/* Graph visual */}
                        <div className="absolute bottom-6 -right-10 w-24 h-16 bg-white/80 backdrop-blur rounded-xl border border-slate-100 flex items-end justify-between p-3 shadow-lg">
                           <div className="w-3 bg-blue-100 h-[30%] rounded-t-sm"></div>
                           <div className="w-3 bg-blue-200 h-[50%] rounded-t-sm"></div>
                           <div className="w-3 bg-blue-400 h-[80%] rounded-t-sm"></div>
                           <div className="w-3 bg-blue-600 h-[100%] rounded-t-sm"></div>
                        </div>
                      </div>
                   </div>
                </div>
                <div className="px-4">
                   <h3 className="text-2xl font-bold text-slate-900 mb-3 flex items-center gap-3">
                     데이터 기반 인사이트
                     <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                   </h3>
                   <p className="text-slate-600 leading-relaxed text-lg">
                      누가 내 작품을 좋아했는지, 어떤 경로로 방문했는지. 
                      상세한 데이터 분석 대시보드를 통해 팬덤의 성향을 파악하고 
                      나를 더 효과적으로 브랜딩하는 전략을 세우세요.
                   </p>
                </div>
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
