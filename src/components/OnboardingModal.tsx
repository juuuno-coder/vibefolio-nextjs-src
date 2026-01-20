"use client";

import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FontAwesomeIcon } from "./FaIcon";
import {
  faCheck,
  faArrowRight,
  faStar,
} from "@fortawesome/free-solid-svg-icons";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/AuthContext";

import { GENRE_CATEGORIES_WITH_ICONS as GENRE_CATEGORIES, FIELD_CATEGORIES_WITH_ICONS as FIELD_CATEGORIES } from "@/lib/ui-constants";

interface OnboardingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userEmail: string;
  onComplete: () => void;
}

export function OnboardingModal({
  open,
  onOpenChange,
  userId,
  userEmail,
  onComplete,
}: OnboardingModalProps) {
  const { refreshUserProfile } = useAuth();
  const [step, setStep] = useState(0); // 0: 환영, 1: 닉네임, 2: 장르/분야, 3: 축하
  const [nickname, setNickname] = useState("");
  const [genres, setGenres] = useState<string[]>([]);
  const [fields, setFields] = useState<string[]>([]);
  const [expertFields, setExpertFields] = useState<string[]>([]);
  const [isExpert, setIsExpert] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGenreToggle = (value: string) => {
    setGenres(prev =>
      prev.includes(value)
        ? prev.filter(g => g !== value)
        : prev.length < 5
        ? [...prev, value]
        : prev
    );
  };

  const handleFieldToggle = (value: string) => {
    setFields(prev =>
      prev.includes(value)
        ? prev.filter(f => f !== value)
        : prev.length < 3
        ? [...prev, value]
        : prev
    );
  };

  const handleExpertToggle = (value: string) => {
    setExpertFields(prev =>
      prev.includes(value)
        ? prev.filter(f => f !== value)
        : [...prev, value]
    );
  };

  const handleNextStep = async () => {
    setError("");

    if (step === 1) {
       if (!nickname.trim()) {
         setError("닉네임을 입력해주세요.");
         return;
       }
       
       // 닉네임 중복 체크
       setLoading(true);
       try {
         const { count, error } = await supabase
           .from('profiles')
           .select('id', { count: 'exact', head: true })
           .eq('username', nickname)
           .neq('id', userId); // 내 ID는 제외
           
         if (error) {
            console.error("Nickname check failed:", error);
            // 에러 발생 시 진행은 하되 로그 남김
         } else if (count && count > 0) {
            setError("이미 사용 중인 닉네임입니다. 다른 닉네임을 입력해주세요.");
            setLoading(false);
            return;
         }
       } catch (e) {
          console.error("Nickname check exception:", e);
       } finally {
          setLoading(false);
       }
    }

    if (step === 2 && genres.length === 0) {
      setError("최소 1개의 장르를 선택해주세요.");
      return;
    }
    
    setStep(prev => prev + 1);
  };

  const handleComplete = async () => {
    if (genres.length === 0) {
      setError("최소 1개의 장르를 선택해주세요.");
      return;
    }

    setLoading(true);
    setError("");
    console.log("[Onboarding] 시작 - nickname:", nickname, "genres:", genres, "fields:", fields);

    try {
      // 세션 새로고침 먼저 시도
      console.log("[Onboarding] 세션 갱신 시도...");
      await supabase.auth.refreshSession();

      // 1. Supabase Auth 업데이트 (실패해도 진행)
      console.log("[Onboarding] Auth 업데이트 시작...");
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("TIMEOUT")), 5000); // 5초 타임아웃
      });

      const updatePromise = supabase.auth.updateUser({
        data: {
          nickname: nickname,
          profile_image_url: '/globe.svg',
          interests: { genres, fields },
          expertise: { fields: expertFields },
          onboarding_completed: true,
        },
      });

      try {
        await Promise.race([updatePromise, timeoutPromise]);
        console.log("[Onboarding] Auth 업데이트 성공");
      } catch (e) {
        console.warn("[Onboarding] Auth 업데이트 실패/타임아웃 (무시하고 진행):", e);
      }

      // 2. profiles 테이블 업데이트 (이것이 실질적인 서비스 프로필)
      console.log("[Onboarding] profiles 테이블 업데이트 시작...");
      const { error: profileError } = await (supabase as any)
        .from('profiles')
        .upsert({
          id: userId,
          // email: userEmail, // DB에 컬럼이 없어 에러 발생으로 제거
          username: nickname, // 닉네임을 username으로 저장
          interests: { genres, fields }, // 관심사 정보 저장
          expertise: { fields: expertFields }, // 전문 분야 정보 저장
          avatar_url: '/globe.svg', // 기본 아바타 설정 (없을 경우)
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' });

      if (profileError) {
        console.error('[Onboarding] profiles 업데이트 에러:', profileError);
        throw new Error("정보 저장 실패: " + profileError.message);
      }
      
      console.log("[Onboarding] profiles 업데이트 완료");

      // 성공 처리
      console.log("[Onboarding] 완료 처리 시작...");
      
      // 1. 헤더 등 전역 상태 업데이트 (약간의 지연을 주어 DB 반영 시간 확보)
      setTimeout(() => {
        refreshUserProfile();
      }, 500);
      
      // 2. 축하 화면으로 이동 (모달 닫지 않음)
      setLoading(false);
      setStep(3); // 3: 완료 축하 화면
      // onComplete(); // onComplete는 최종 확인 버튼 클릭 시 호출
      // onOpenChange(false);
      console.log("[Onboarding] 축하 화면으로 이동");

    } catch (error: any) {
      console.error('[Onboarding] 에러 발생:', error);
      setLoading(false);
      
      // 중복 닉네임 에러 처리
      if (error.message?.includes('username_key') || error.message?.includes('duplicate key') || error.code === '23505') {
          setError("이미 사용 중인 닉네임입니다. 화면 상단의 '1/2'를 눌러 닉네임을 변경해주세요.");
          // 사용자 편의를 위해 자동으로 스텝 1로 이동시킬 수도 있지만, 에러 메시지를 읽게 하는 것이 나음
          // 혹은 버튼을 추가해줄 수 있음.
          // 여기서 setStep(1)을 바로 하면 에러 메시지가 사라질 수 있으므로(스텝1 상태에선 error state가 초기화될 수 있음 - handleNextStep에서 초기화 안함)
          // 그래도 직관적으로 "닉네임이 중복됨"을 알리기 위해 메시지를 띄우는 게 낫음.
      } else {
          setError(error.message || '정보 저장에 실패했습니다.');
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-lg p-0 overflow-hidden" showCloseButton={false}>
        {/* 스텝 0: 환영 */}
        {step === 0 && (
          <div className="p-8 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <FontAwesomeIcon icon={faStar} className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              환영합니다! 🎉
            </h2>
            <p className="text-gray-500 mb-6">
              회원가입이 완료되었습니다.<br />
              맞춤 콘텐츠를 위해 간단한 정보를 입력해주세요.
            </p>
            <Button
              onClick={() => setStep(1)}
              className="w-full h-12 bg-green-600 hover:bg-green-700 text-white rounded-full"
            >
              시작하기
              <FontAwesomeIcon icon={faArrowRight} className="ml-2 w-4 h-4" />
            </Button>
          </div>
        )}

        {/* 스텝 1: 닉네임 */}
        {step === 1 && (
          <div className="p-8">
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 text-sm text-green-600 font-medium mb-2">
                <span className="w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center text-xs">1</span>
                / 2
              </div>
              <h2 className="text-xl font-bold text-gray-900">
                닉네임을 입력해주세요
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                다른 사용자들에게 보여질 이름입니다
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm mb-4">
                {error}
              </div>
            )}

            <Input
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="닉네임을 입력하세요"
              className="h-12 text-center text-lg"
              maxLength={20}
            />
            <p className="text-xs text-gray-400 text-center mt-2">
              최대 20자
            </p>

            <Button
              onClick={handleNextStep}
              disabled={!nickname.trim()}
              className="w-full h-12 bg-green-600 hover:bg-green-700 text-white rounded-full mt-6"
            >
              다음
              <FontAwesomeIcon icon={faArrowRight} className="ml-2 w-4 h-4" />
            </Button>
          </div>
        )}

        {/* 스텝 2: 장르/분야 선택 */}
        {step === 2 && (
          <div className="p-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
            <div className="text-center mb-6">
              <button 
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-2 text-sm text-green-600 font-medium mb-2 hover:bg-green-50 px-3 py-1 rounded-full transition-colors"
                title="이전 단계로 돌아가기 (닉네임 수정)"
              >
                <span className="w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center text-xs">2</span>
                / 3
                <span className="text-xs text-gray-400 ml-1 font-normal">← 이전</span>
              </button>
              <h2 className="text-xl font-bold text-gray-900">
                관심 장르와 분야를 선택해주세요
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                맞춤 콘텐츠를 추천해드립니다
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm mb-4">
                {error}
              </div>
            )}

            {/* 장르 선택 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                관심 장르 (최소 1개, 최대 5개)
              </label>
              <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                {GENRE_CATEGORIES.map((genre) => {
                  const isSelected = genres.includes(genre.value);
                  const isDisabled = !isSelected && genres.length >= 5;
                  return (
                    <button
                      key={genre.value}
                      type="button"
                      onClick={() => handleGenreToggle(genre.value)}
                      disabled={isDisabled}
                      className={`relative flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
                        isSelected
                          ? "bg-green-50 border-green-600 text-green-600"
                          : isDisabled
                          ? "bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed"
                          : "bg-white border-gray-200 text-gray-600 hover:border-green-600 hover:text-green-600"
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-1 right-1 w-4 h-4 bg-green-600 rounded-full flex items-center justify-center">
                          <FontAwesomeIcon icon={faCheck} className="w-2 h-2 text-white" />
                        </div>
                      )}
                      <FontAwesomeIcon icon={genre.icon} className="w-5 h-5 mb-1" />
                      <span className="text-xs font-medium">{genre.label}</span>
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-xs text-gray-500">
                선택: {genres.length}/5
              </p>
            </div>

            {/* 분야 선택 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                관심 분야 (선택, 최대 3개)
              </label>
              <div className="flex flex-wrap gap-2">
                {FIELD_CATEGORIES.map((field) => {
                  const isSelected = fields.includes(field.value);
                  const isDisabled = !isSelected && fields.length >= 3;
                  return (
                    <button
                      key={field.value}
                      type="button"
                      onClick={() => handleFieldToggle(field.value)}
                      disabled={isDisabled}
                      className={`px-3 py-1.5 rounded-full border text-sm font-medium transition-all flex items-center gap-1 ${
                        isSelected
                          ? "bg-green-600 border-green-600 text-white"
                          : isDisabled
                          ? "bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed"
                          : "bg-white border-gray-200 text-gray-600 hover:border-green-400 hover:text-green-500"
                      }`}
                    >
                      {field.label}
                      {isSelected && <FontAwesomeIcon icon={faCheck} className="w-2.5 h-2.5" />}
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-xs text-gray-500">
                선택: {fields.length}/3
              </p>
            </div>

            <Button
              onClick={handleNextStep}
              disabled={loading || genres.length === 0}
              className="w-full h-12 bg-green-600 hover:bg-green-700 text-white rounded-full mt-4"
            >
              다음 단계로
              <FontAwesomeIcon icon={faArrowRight} className="ml-2 w-4 h-4" />
            </Button>
            
            {/* 나중에 설정하기 버튼 */}
            <button
              type="button"
              onClick={() => {
                // 로컬 스토리지에 건너뛰기 플래그 저장
                console.log("[Onboarding] 나중에 설정하기 클릭");
                localStorage.setItem(`onboarding_skipped_${userId}`, 'true');
                onComplete();
                onOpenChange(false);
              }}
              disabled={loading}
              className="w-full mt-2 text-sm text-gray-500 hover:text-gray-700 underline"
            >
              나중에 설정하기
            </button>
          </div>
        )}

        {/* 스텝 3: 전문 분야 선택 (자부심 뱃지) */}
        {step === 3 && (
          <div className="p-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
            <div className="text-center mb-6">
              <button 
                onClick={() => setStep(2)}
                className="inline-flex items-center gap-2 text-sm text-blue-600 font-medium mb-2 hover:bg-blue-50 px-3 py-1 rounded-full transition-colors"
              >
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">3</span>
                / 3
                <span className="text-xs text-gray-400 ml-1 font-normal">← 이전</span>
              </button>
              <h2 className="text-xl font-bold text-gray-900">
                전문 분야가 있으신가요? 🎖️
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                선택하신 분야는 프로필 뱃지로 표시됩니다
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl mb-6">
               <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                     <FontAwesomeIcon icon={faStar} className="text-blue-600 w-4 h-4" />
                  </div>
                  <span className="font-bold text-blue-900 text-sm">전문가 뱃지 신청</span>
               </div>
               <p className="text-xs text-blue-700 leading-relaxed">
                  자신의 직업이나 전문 지식을 갖춘 분야를 선택해주세요. 
                  평가 시 '전문가 의견'으로 강조되어 신뢰도를 높일 수 있습니다.
               </p>
            </div>

            <div className="space-y-6">
               <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-2xl">
                  <span className="font-medium text-gray-700">전문 분야 등록하기</span>
                  <input 
                    type="checkbox" 
                    className="w-5 h-5 accent-blue-600"
                    checked={isExpert}
                    onChange={(e) => setIsExpert(e.target.checked)}
                  />
               </div>

               {isExpert && (
                 <div className="animate-in fade-in slide-in-from-top-2">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      나의 전문 분야 (다중 선택 가능)
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {[...GENRE_CATEGORIES, ...FIELD_CATEGORIES].map((item) => {
                        const isSelected = expertFields.includes(item.value);
                        return (
                          <button
                            key={item.value}
                            type="button"
                            onClick={() => handleExpertToggle(item.value)}
                            className={`px-3 py-1.5 rounded-full border text-sm font-medium transition-all ${
                              isSelected
                                ? "bg-blue-600 border-blue-600 text-white shadow-md"
                                : "bg-white border-gray-200 text-gray-600 hover:border-blue-400 hover:text-blue-500"
                            }`}
                          >
                            {item.label}
                          </button>
                        );
                      })}
                    </div>
                 </div>
               )}
            </div>

            <Button
              onClick={handleComplete}
              disabled={loading || (isExpert && expertFields.length === 0)}
              className="w-full h-12 bg-gray-900 hover:bg-black text-white rounded-full mt-10 shadow-lg"
            >
              {loading ? "저장 중..." : "정말 완료!"}
            </Button>
            
            <button
               onClick={handleComplete}
               className="w-full mt-3 text-xs text-gray-400 hover:text-gray-600 text-center"
            >
               나중에 설정하거나 건너뛰기
            </button>
          </div>
        )}

        {/* 스텝 4: 완료 축하 */}
        {step === 4 && (
          <div className="p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FontAwesomeIcon icon={faCheck} className="w-10 h-10 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              설정이 완료되었습니다! 🎉
            </h2>
            <p className="text-gray-500 mb-8">
              이제 나만의 포트폴리오를 만들고<br />
              다양한 크리에이터들과 소통해보세요.
            </p>
            <Button
              onClick={() => {
                onComplete();
                onOpenChange(false);
              }}
              className="w-full h-12 bg-green-600 hover:bg-green-700 text-white rounded-full"
            >
              서비스 시작하기
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
