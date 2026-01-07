"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Check, Sparkles, Users, Zap } from "lucide-react";
import Link from "next/link";

export default function AboutPage() {
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);

  useEffect(() => {
    setIsVideoLoaded(true);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section with Video Background */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Video Background */}
        <div className="absolute inset-0 z-0">
          {isVideoLoaded && (
            <video
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover"
            >
              <source
                src="https://assets.mixkit.co/videos/preview/mixkit-creative-people-working-in-an-office-4716-large.mp4"
                type="video/mp4"
              />
            </video>
          )}
          {/* Dark Overlay */}
          <div className="absolute inset-0 bg-black/60"></div>
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60"></div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center text-white">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full mb-6 border border-white/20">
            <Sparkles className="w-4 h-4 text-green-400" />
            <span className="text-sm font-medium">크리에이터를 위한 포트폴리오 플랫폼</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            당신의 창작물을
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500">
              세상과 연결하세요
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-200 mb-10 max-w-3xl mx-auto leading-relaxed">
            바이브폴리오는 크리에이터들이 자신의 작품을 공유하고,
            <br className="hidden md:block" />
            협업 기회를 찾고, 함께 성장하는 공간입니다.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/signup">
              <Button
                size="lg"
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-6 text-lg rounded-full shadow-lg hover:shadow-xl transition-all"
              >
                무료로 시작하기
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>

            <Button
              size="lg"
              variant="outline"
              className="border-2 border-white text-white hover:bg-white hover:text-gray-900 px-8 py-6 text-lg rounded-full backdrop-blur-sm bg-white/10"
            >
              <Play className="mr-2 w-5 h-5" />
              소개 영상 보기
            </Button>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-3 gap-8 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-green-400 mb-2">10K+</div>
              <div className="text-sm text-gray-300">크리에이터</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-green-400 mb-2">50K+</div>
              <div className="text-sm text-gray-300">프로젝트</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-green-400 mb-2">100K+</div>
              <div className="text-sm text-gray-300">월간 방문자</div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10">
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white rounded-full mt-2 animate-bounce"></div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              왜 바이브폴리오인가요?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              크리에이터를 위한 모든 기능을 한 곳에서
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mb-6">
                <Sparkles className="w-7 h-7 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                아름다운 포트폴리오
              </h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                드래그 앤 드롭으로 쉽게 만드는 전문가급 포트폴리오. 
                당신의 작품을 가장 멋지게 보여주세요.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center text-sm text-gray-700">
                  <Check className="w-5 h-5 text-green-600 mr-2 flex-shrink-0" />
                  다양한 템플릿
                </li>
                <li className="flex items-center text-sm text-gray-700">
                  <Check className="w-5 h-5 text-green-600 mr-2 flex-shrink-0" />
                  커스터마이징 가능
                </li>
                <li className="flex items-center text-sm text-gray-700">
                  <Check className="w-5 h-5 text-green-600 mr-2 flex-shrink-0" />
                  모바일 최적화
                </li>
              </ul>
            </div>

            {/* Feature 2 */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mb-6">
                <Users className="w-7 h-7 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                협업 기회 발견
              </h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                같은 관심사를 가진 크리에이터들과 연결되고,
                새로운 프로젝트 기회를 찾아보세요.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center text-sm text-gray-700">
                  <Check className="w-5 h-5 text-green-600 mr-2 flex-shrink-0" />
                  프로젝트 제안
                </li>
                <li className="flex items-center text-sm text-gray-700">
                  <Check className="w-5 h-5 text-green-600 mr-2 flex-shrink-0" />
                  크리에이터 네트워크
                </li>
                <li className="flex items-center text-sm text-gray-700">
                  <Check className="w-5 h-5 text-green-600 mr-2 flex-shrink-0" />
                  채용 정보
                </li>
              </ul>
            </div>

            {/* Feature 3 */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mb-6">
                <Zap className="w-7 h-7 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                성장 지원
              </h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                공모전, 이벤트, 교육 정보까지.
                크리에이터로서 성장할 수 있는 모든 것을 제공합니다.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center text-sm text-gray-700">
                  <Check className="w-5 h-5 text-green-600 mr-2 flex-shrink-0" />
                  공모전 정보
                </li>
                <li className="flex items-center text-sm text-gray-700">
                  <Check className="w-5 h-5 text-green-600 mr-2 flex-shrink-0" />
                  교육 프로그램
                </li>
                <li className="flex items-center text-sm text-gray-700">
                  <Check className="w-5 h-5 text-green-600 mr-2 flex-shrink-0" />
                  커뮤니티 이벤트
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-green-600 to-emerald-700 text-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            지금 바로 시작하세요
          </h2>
          <p className="text-xl text-green-100 mb-10">
            무료로 가입하고 당신의 창작 여정을 시작하세요
          </p>
          <Link href="/signup">
            <Button
              size="lg"
              className="bg-white text-green-600 hover:bg-gray-100 px-10 py-6 text-lg rounded-full shadow-xl hover:shadow-2xl transition-all"
            >
              무료로 시작하기
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
