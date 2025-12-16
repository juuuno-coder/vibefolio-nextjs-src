"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCamera,
  faWandMagicSparkles,
  faPalette,
  faPenRuler,
  faVideo,
  faFilm,
  faHeadphones,
  faCube,
  faFileLines,
  faCode,
  faMobileScreen,
  faGamepad,
  faCheck,
} from "@fortawesome/free-solid-svg-icons";

// 장르 카테고리
const GENRE_CATEGORIES = [
  { icon: faCamera, label: "포토", value: "photo" },
  { icon: faWandMagicSparkles, label: "애니메이션", value: "animation" },
  { icon: faPalette, label: "그래픽", value: "graphic" },
  { icon: faPenRuler, label: "디자인", value: "design" },
  { icon: faVideo, label: "영상", value: "video" },
  { icon: faFilm, label: "영화·드라마", value: "cinema" },
  { icon: faHeadphones, label: "오디오", value: "audio" },
  { icon: faCube, label: "3D", value: "3d" },
  { icon: faFileLines, label: "텍스트", value: "text" },
  { icon: faCode, label: "코드", value: "code" },
  { icon: faMobileScreen, label: "웹/앱", value: "webapp" },
  { icon: faGamepad, label: "게임", value: "game" },
];

// 산업 분야 카테고리
const FIELD_CATEGORIES = [
  { label: "경제/금융", value: "finance" },
  { label: "헬스케어", value: "healthcare" },
  { label: "뷰티/패션", value: "beauty" },
  { label: "반려", value: "pet" },
  { label: "F&B", value: "fnb" },
  { label: "여행/레저", value: "travel" },
  { label: "교육", value: "education" },
  { label: "IT", value: "it" },
  { label: "라이프스타일", value: "lifestyle" },
  { label: "비즈니스", value: "business" },
];

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    passwordConfirm: "",
    username: "",
    genres: [] as string[],
    fields: [] as string[],
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGenreToggle = (value: string) => {
    setFormData(prev => {
      const genres = prev.genres.includes(value)
        ? prev.genres.filter(g => g !== value)
        : prev.genres.length < 5
        ? [...prev.genres, value]
        : prev.genres;
      return { ...prev, genres };
    });
  };

  const handleFieldToggle = (value: string) => {
    setFormData(prev => {
      const fields = prev.fields.includes(value)
        ? prev.fields.filter(f => f !== value)
        : prev.fields.length < 3
        ? [...prev.fields, value]
        : prev.fields;
      return { ...prev, fields };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.passwordConfirm) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }

    if (formData.password.length < 6) {
      setError("비밀번호는 최소 6자 이상이어야 합니다.");
      return;
    }

    if (!formData.username.trim()) {
      setError("사용자 이름을 입력해주세요.");
      return;
    }

    if (formData.genres.length === 0) {
      setError("최소 1개의 장르를 선택해주세요.");
      return;
    }

    setLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            nickname: formData.username,
            profile_image_url: '/globe.svg',
            interests: {
              genres: formData.genres,
              fields: formData.fields,
            },
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("회원가입에 실패했습니다.");

      alert('회원가입이 완료되었습니다! 로그인 페이지로 이동합니다.');
      router.push('/login');
      
    } catch (error: any) {
      console.error('회원가입 오류:', error);
      setError(error.message || '회원가입 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="w-full max-w-2xl space-y-8 bg-white p-8 rounded-xl shadow-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            회원가입
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            이미 계정이 있으신가요?{" "}
            <Link
              href="/login"
              className="font-medium text-[#4ACAD4] hover:text-[#41a3aa]"
            >
              로그인
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                사용자 이름
              </label>
              <Input
                id="username"
                name="username"
                type="text"
                required
                value={formData.username}
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
                placeholder="사용자 이름"
                className="h-11"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                이메일
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="example@email.com"
                className="h-11"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  비밀번호
                </label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  placeholder="최소 6자 이상"
                  className="h-11"
                />
              </div>
              <div>
                <label htmlFor="password-confirm" className="block text-sm font-medium text-gray-700 mb-1">
                  비밀번호 확인
                </label>
                <Input
                  id="password-confirm"
                  name="password-confirm"
                  type="password"
                  required
                  value={formData.passwordConfirm}
                  onChange={(e) =>
                    setFormData({ ...formData, passwordConfirm: e.target.value })
                  }
                  placeholder="비밀번호 확인"
                  className="h-11"
                />
              </div>
            </div>

            {/* 장르 선택 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                관심 장르 (최소 1개, 최대 5개)
              </label>
              <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                {GENRE_CATEGORIES.map((genre) => {
                  const isSelected = formData.genres.includes(genre.value);
                  const isDisabled = !isSelected && formData.genres.length >= 5;
                  return (
                    <button
                      key={genre.value}
                      type="button"
                      onClick={() => handleGenreToggle(genre.value)}
                      disabled={isDisabled}
                      className={`relative flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
                        isSelected
                          ? "bg-[#4ACAD4]/10 border-[#4ACAD4] text-[#4ACAD4]"
                          : isDisabled
                          ? "bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed"
                          : "bg-white border-gray-200 text-gray-600 hover:border-[#4ACAD4] hover:text-[#4ACAD4]"
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-1 right-1 w-4 h-4 bg-[#4ACAD4] rounded-full flex items-center justify-center">
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
                선택된 장르: {formData.genres.length}/5
              </p>
            </div>

            {/* 분야 선택 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                관심 분야 (선택, 최대 3개)
              </label>
              <div className="flex flex-wrap gap-2">
                {FIELD_CATEGORIES.map((field) => {
                  const isSelected = formData.fields.includes(field.value);
                  const isDisabled = !isSelected && formData.fields.length >= 3;
                  return (
                    <button
                      key={field.value}
                      type="button"
                      onClick={() => handleFieldToggle(field.value)}
                      disabled={isDisabled}
                      className={`px-4 py-2 rounded-full border text-sm font-medium transition-all flex items-center gap-1.5 ${
                        isSelected
                          ? "bg-indigo-500 border-indigo-500 text-white"
                          : isDisabled
                          ? "bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed"
                          : "bg-white border-gray-200 text-gray-600 hover:border-indigo-400 hover:text-indigo-500"
                      }`}
                    >
                      {field.label}
                      {isSelected && <FontAwesomeIcon icon={faCheck} className="w-3 h-3" />}
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-xs text-gray-500">
                선택된 분야: {formData.fields.length}/3
              </p>
            </div>
          </div>

          <div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-[#4ACAD4] hover:bg-[#41a3aa] text-white rounded-full text-base font-medium"
            >
              {loading ? "가입 중..." : "가입하기"}
            </Button>
          </div>
        </form>

        <div className="text-center text-sm text-gray-600">
          <p>
            회원가입 시{" "}
            <a href="#" className="text-[#4ACAD4] hover:underline">
              이용약관
            </a>{" "}
            및{" "}
            <a href="#" className="text-[#4ACAD4] hover:underline">
              개인정보처리방침
            </a>
            에 동의하게 됩니다.
          </p>
        </div>
      </div>
    </div>
  );
}
