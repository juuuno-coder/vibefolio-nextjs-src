"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStar, faFaceSmile, faLock, faPaperPlane, faRocket, faCheckCircle, faBolt } from "@fortawesome/free-solid-svg-icons";
import { useRouter } from "next/navigation";

export default function FeedbackFeaturesPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-[#0d0d12] text-white pt-32 pb-24">
        {/* Background Effects */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
           <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-purple-600/30 rounded-full blur-[100px] animate-pulse"></div>
           <div className="absolute top-40 -left-20 w-[400px] h-[400px] bg-green-500/20 rounded-full blur-[80px]"></div>
           <div className="absolute bottom-0 right-1/4 w-[500px] h-[300px] bg-blue-600/20 rounded-full blur-[80px]"></div>
        </div>

        <div className="container mx-auto px-6 relative z-10 text-center">
           <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-md rounded-full border border-white/10 text-sm font-medium mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              NEW FEATURES UPDATE
           </div>
           
           <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-8 leading-tight animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-100">
             크리에이터의 성장을 가속화할<br/>
             <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500">3가지 강력한 무기</span>
           </h1>
           
           <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-200">
             단순한 좋아요를 넘어, 실질적인 도움이 되는 피드백을 주고받으세요.<br/>
             Vibefolio가 여러분의 작업을 다음 단계로 끌어올릴 새로운 도구들을 소개합니다.
           </p>

           <div className="flex flex-col sm:flex-row gap-4 justify-center animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-300">
              <Button onClick={() => router.push('/growth')} className="h-14 px-10 rounded-full bg-white text-black hover:bg-gray-100 text-lg font-bold">
                 지금 체험하러 가기
              </Button>
           </div>
        </div>
      </section>

      {/* Feature 1: Michelin Rating */}
      <section className="py-24 bg-white border-b border-gray-100">
         <div className="container mx-auto px-6">
            <div className="flex flex-col md:flex-row items-center gap-16">
               <div className="flex-1 order-2 md:order-1">
                  <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center text-red-500 mb-6">
                     <FontAwesomeIcon icon={faStar} className="text-2xl" />
                  </div>
                  <h2 className="text-4xl font-bold text-gray-900 mb-4">미슐랭 스타일 평가 시스템</h2>
                  <p className="text-lg text-gray-600 leading-relaxed mb-6">
                     1점부터 3점까지, 미슐랭 가이드에서 영감을 받은 신중한 평가 시스템을 도입했습니다. 
                     가벼운 '좋아요' 대신 작품의 가치를 진지하게 고민해볼 수 있는 기회를 제공합니다.
                  </p>
                  <ul className="space-y-3">
                     <li className="flex items-center gap-3 text-gray-700">
                        <FontAwesomeIcon icon={faCheckCircle} className="text-green-500" />
                        <span>1점: 흥미로운 작품 (Interesting)</span>
                     </li>
                     <li className="flex items-center gap-3 text-gray-700">
                        <FontAwesomeIcon icon={faCheckCircle} className="text-green-500" />
                        <span>2점: 훌륭한 작품 (Excellent)</span>
                     </li>
                     <li className="flex items-center gap-3 text-gray-700">
                        <FontAwesomeIcon icon={faCheckCircle} className="text-green-500" />
                        <span>3점: 반드시 봐야 할 걸작 (Exceptional)</span>
                     </li>
                  </ul>
               </div>
               <div className="flex-1 order-1 md:order-2 flex justify-center">
                  <div className="w-full max-w-md aspect-square bg-gradient-to-br from-red-500 to-orange-400 rounded-3xl shadow-2xl flex items-center justify-center relative p-8 transform hover:scale-105 transition-transform duration-500">
                      <div className="bg-white/90 backdrop-blur rounded-2xl p-6 w-full shadow-lg">
                          <div className="flex justify-center gap-2 mb-2">
                             {[1,2,3].map(i => (
                                 <FontAwesomeIcon key={i} icon={faStar} className="text-3xl text-red-500 drop-shadow-sm" />
                             ))}
                          </div>
                          <p className="text-center font-bold text-gray-800">Exceptional</p>
                          <p className="text-center text-xs text-gray-500 mt-1">이 분야를 정의하는 탁월한 작품입니다.</p>
                      </div>
                      {/* Badge Effect */}
                      <div className="absolute -top-6 -right-6 w-20 h-20 bg-yellow-400 rounded-full flex items-center justify-center text-black font-black text-xs shadow-lg animate-bounce">
                         NEW!
                      </div>
                  </div>
               </div>
            </div>
         </div>
      </section>

      {/* Feature 2: Quick Sticker Feedback */}
      <section className="py-24 bg-gray-50 border-b border-gray-100">
         <div className="container mx-auto px-6">
            <div className="flex flex-col md:flex-row items-center gap-16">
               <div className="flex-1 flex justify-center">
                  <div className="w-full max-w-md aspect-square bg-gradient-to-br from-blue-400 to-indigo-500 rounded-3xl shadow-2xl flex items-center justify-center p-8 transform hover:rotate-3 transition-transform duration-500">
                      <div className="grid grid-cols-2 gap-4 w-full">
                          <div className="bg-white rounded-2xl p-4 flex flex-col items-center gap-2 shadow-sm hover:-translate-y-2 transition-transform">
                              <span className="text-4xl">🎨</span>
                              <span className="text-xs font-bold text-gray-600">색감이 좋아요</span>
                          </div>
                          <div className="bg-white rounded-2xl p-4 flex flex-col items-center gap-2 shadow-sm hover:-translate-y-2 transition-transform delay-75">
                              <span className="text-4xl">💡</span>
                              <span className="text-xs font-bold text-gray-600">아이디어 굿</span>
                          </div>
                          <div className="bg-white rounded-2xl p-4 flex flex-col items-center gap-2 shadow-sm hover:-translate-y-2 transition-transform delay-150">
                              <span className="text-4xl">📐</span>
                              <span className="text-xs font-bold text-gray-600">구도가 완벽해요</span>
                          </div>
                          <div className="bg-white rounded-2xl p-4 flex flex-col items-center gap-2 shadow-sm hover:-translate-y-2 transition-transform delay-200">
                              <span className="text-4xl">🔥</span>
                              <span className="text-xs font-bold text-gray-600">트렌디해요</span>
                          </div>
                      </div>
                  </div>
               </div>
               <div className="flex-1">
                  <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 mb-6">
                     <FontAwesomeIcon icon={faFaceSmile} className="text-2xl" />
                  </div>
                  <h2 className="text-4xl font-bold text-gray-900 mb-4">빠르고 직관적인 스티커 피드백</h2>
                  <p className="text-lg text-gray-600 leading-relaxed mb-6">
                     긴 글을 쓰지 않아도 괜찮습니다. 직관적인 이모지와 스티커로 작성자의 핵심 강점을 칭찬해주세요. 
                     작은 칭찬 하나가 크리에이터에게는 큰 동기부여가 됩니다.
                  </p>
                  <ul className="space-y-3">
                     <li className="flex items-center gap-3 text-gray-700">
                        <FontAwesomeIcon icon={faBolt} className="text-yellow-500" />
                        <span>원클릭으로 전달하는 응원</span>
                     </li>
                     <li className="flex items-center gap-3 text-gray-700">
                        <FontAwesomeIcon icon={faBolt} className="text-yellow-500" />
                        <span>다양한 피드백 카테고리 (색감, 아이디어, 완성도 등)</span>
                     </li>
                  </ul>
               </div>
            </div>
         </div>
      </section>

      {/* Feature 3: Secret Proposal */}
      <section className="py-24 bg-white">
         <div className="container mx-auto px-6">
            <div className="flex flex-col md:flex-row items-center gap-16">
               <div className="flex-1 order-2 md:order-1">
                  <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 mb-6">
                     <FontAwesomeIcon icon={faLock} className="text-2xl" />
                  </div>
                  <h2 className="text-4xl font-bold text-gray-900 mb-4">프라이빗한 시크릿 제안</h2>
                  <p className="text-lg text-gray-600 leading-relaxed mb-6">
                     공개적인 댓글로 말하기 어려운 협업 제안이나 구체적인 피드백이 있나요? 
                     '시크릿 모드'를 켜고 작성자와 비밀스럽게 소통하세요. 오직 두 사람만이 내용을 볼 수 있습니다.
                  </p>
                  <Button onClick={() => router.push('/growth')} variant="outline" className="rounded-full border-gray-300">
                     성장하기 게시판 가기
                  </Button>
               </div>
               <div className="flex-1 order-1 md:order-2 flex justify-center">
                  <div className="w-full max-w-md p-8 bg-gray-900 text-white rounded-3xl shadow-2xl relative overflow-hidden group">
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-green-500"></div>
                      <div className="flex items-center gap-3 mb-6">
                          <FontAwesomeIcon icon={faLock} className="text-emerald-400" />
                          <span className="text-sm font-bold text-emerald-400 uppercase tracking-widest">Secret Mode ON</span>
                      </div>
                      <div className="space-y-4">
                          <div className="h-4 bg-gray-700 rounded w-3/4 animate-pulse"></div>
                          <div className="h-4 bg-gray-700 rounded w-full animate-pulse delay-75"></div>
                          <div className="h-4 bg-gray-700 rounded w-5/6 animate-pulse delay-150"></div>
                      </div>
                      <div className="mt-8 flex justify-end">
                          <span className="px-4 py-2 bg-emerald-600 rounded-lg text-sm font-bold flex items-center gap-2">
                             <FontAwesomeIcon icon={faPaperPlane} /> 전송 완료
                          </span>
                      </div>
                  </div>
               </div>
            </div>
         </div>
      </section>

      {/* Footer CTA */}
      <section className="py-24 bg-gray-50 border-t border-gray-200 text-center">
         <div className="container mx-auto px-6">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">여러분의 성장을 끝까지 응원합니다</h2>
            <p className="text-gray-500 mb-10 max-w-xl mx-auto">
               지금 바로 프로젝트를 업로드하고, 동료들의 솔직한 피드백을 받아보세요.
            </p>
            <Button onClick={() => router.push('/growth')} className="h-14 px-12 rounded-full bg-black text-white hover:bg-gray-800 text-lg font-bold shadow-xl hover:shadow-2xl transition-all">
               성장하기 시작하기
            </Button>
         </div>
      </section>
    </div>
  );
}
