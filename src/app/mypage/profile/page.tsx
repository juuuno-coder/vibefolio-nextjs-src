// src/app/mypage/profile/page.tsx

"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { User, Mail, Phone, MapPin, Link as LinkIcon, Upload, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { GENRE_CATEGORIES_WITH_ICONS as GENRE_CATEGORIES, FIELD_CATEGORIES_WITH_ICONS as FIELD_CATEGORIES } from "@/lib/ui-constants";

interface UserProfile {
  username: string;
  email: string;
  phone: string;
  bio: string;
  location: string;
  website: string;
  profileImage: string;
  coverImage: string;
  skills: string[];
  interests: {
    genres: string[];
    fields: string[];
  };
  socialLinks: {
    instagram?: string;
    behance?: string;
    linkedin?: string;
  };
}

import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/AuthContext";

// ... (interface 유지)

export default function ProfileSettingsPage() {
  const { refreshUserProfile } = useAuth();
  const [profile, setProfile] = useState<UserProfile>({
    // ... 초기값 유지
    username: "",
    email: "",
    phone: "",
    bio: "",
    location: "",
    website: "",
    profileImage: "/globe.svg",
    coverImage: "",
    skills: [],
    interests: { genres: [], fields: [] },
    socialLinks: {},
  });
  const [newSkill, setNewSkill] = useState("");
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  
  // 회원탈퇴 관련 상태
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 프로필 불러오기
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          console.error('인증 오류:', authError);
          alert('로그인이 필요합니다.');
          window.location.href = '/login';
          return;
        }

        setUserId(user.id);
        
        // Auth에서 이메일 가져오기
        const userEmail = user.email || '';
        const defaultUsername = user.user_metadata?.nickname || userEmail.split('@')[0] || '';

        // Supabase에서 직접 프로필 정보 가져오기 (API 라우트 우회)
        try {
          const { data: userData, error: fetchError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single() as any;

          if (fetchError && fetchError.code !== 'PGRST116') {
             throw fetchError;
          }

          if (userData) {
            console.log("Supabase에서 로드된 유저 데이터:", userData); // 디버깅용
            setProfile({
              username: userData.username || userData.nickname || defaultUsername,
              email: userEmail,
              phone: '', // DB에 없음
              bio: userData.bio || '',
              location: '', // DB에 없음
              website: userData.website || '',
              profileImage: userData.profile_image_url || '/globe.svg',
              coverImage: userData.cover_image_url || '',
              skills: userData.skills || [],
              interests: userData.interests || { genres: [], fields: [] },
              socialLinks: userData.social_links || {},
            });
          } else {
             // 데이터가 없는 경우 기본값
            setProfile(prev => ({ ...prev, username: defaultUsername, email: userEmail }));
          }
        } catch (error) {
          console.error("데이터 로드 오류:", error);
          // 에러 시 기본값 유지
          setProfile(prev => ({ ...prev, username: defaultUsername, email: userEmail }));
        }
      } catch (error) {
        console.error('프로필 로딩 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);


  const [imageFile, setImageFile] = useState<File | null>(null);
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);

  // ... useEffect (생략)

  // 프로필 저장
  const handleSave = async () => {
    if (!userId) {
      alert('로그인 정보가 없습니다.');
      return;
    }

    // 유효성 검사
    if (!profile.username || profile.username.trim() === '') {
      alert('사용자 이름을 입력해주세요.');
      return;
    }

    try {
      let imageUrl = profile.profileImage;
      let coverUrl = profile.coverImage;

      // 프로필 이미지가 새로 업로드되었다면
      if (imageFile) {
        try {
          const { uploadImage } = await import("@/lib/supabase/storage");
          imageUrl = await uploadImage(imageFile, 'profiles');
        } catch (uploadError: any) {
          alert(`프로필 이미지 업로드 실패: ${uploadError.message}`);
          return;
        }
      }

      // 커버 이미지가 새로 업로드되었다면
      if (coverImageFile) {
        try {
          const { uploadImage } = await import("@/lib/supabase/storage");
          // profiles 버킷 사용 (혹은 banners)
          coverUrl = await uploadImage(coverImageFile, 'profiles'); 
        } catch (uploadError: any) {
          alert(`커버 이미지 업로드 실패: ${uploadError.message}`);
          return;
        }
      }

      console.log('프로필 업데이트 시작...');
      
      const { error: updateError } = await (supabase
        .from('profiles') as any)
        .update({
          username: profile.username,
          bio: profile.bio,
          profile_image_url: imageUrl,
          cover_image_url: coverUrl,
          interests: profile.interests,
          website: profile.website,
          social_links: profile.socialLinks,
          skills: profile.skills,
        })
        .eq('id', userId);

      if (updateError) throw updateError;

      alert('프로필이 저장되었습니다!');
      setProfile(prev => ({ ...prev, profileImage: imageUrl, coverImage: coverUrl }));
      setImageFile(null);
      setCoverImageFile(null);
      
      // 헤더 프로필 갱신 (이미지 변경 등 즉시 반영)
      setTimeout(() => {
        refreshUserProfile();
      }, 500);
      
    } catch (error: any) {
      console.error('프로필 저장 실패:', error);
      alert(`프로필 저장 중 오류가 발생했습니다: ${error.message || error}`);
    }
  };

  // 프로필 이미지 선택
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("이미지 크기는 5MB 이하여야 합니다.");
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile({ ...profile, profileImage: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  // 커버 이미지 선택
  const handleCoverImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
       if (file.size > 5 * 1024 * 1024) {
        alert("이미지 크기는 5MB 이하여야 합니다.");
        return;
      }
      setCoverImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile({ ...profile, coverImage: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  // ... (skills handlers remain same)

  // 스킬 추가
  const handleAddSkill = () => {
    if (newSkill.trim() && !profile.skills.includes(newSkill.trim())) {
      setProfile({
        ...profile,
        skills: [...profile.skills, newSkill.trim()],
      });
      setNewSkill("");
    }
  };

  // 스킬 삭제
  const handleRemoveSkill = (skill: string) => {
    setProfile({
      ...profile,
      skills: profile.skills.filter((s) => s !== skill),
    });
  };

  // 관심 장르 토글
  const toggleGenre = (value: string) => {
    setProfile(prev => {
      const genres = prev.interests.genres || [];
      const newGenres = genres.includes(value)
        ? genres.filter(g => g !== value)
        : [...genres, value];
      // 최대 5개 제한 (선택 해제는 가능)
      if (newGenres.length > 5 && newGenres.length > genres.length) return prev;
      return { ...prev, interests: { ...prev.interests, genres: newGenres } };
    });
  };

  // 관심 분야 토글
  const toggleField = (value: string) => {
    setProfile(prev => {
      const fields = prev.interests.fields || [];
      const newFields = fields.includes(value)
        ? fields.filter(f => f !== value)
        : [...fields, value];
      // 최대 3개 제한
      if (newFields.length > 3 && newFields.length > fields.length) return prev;
      return { ...prev, interests: { ...prev.interests, fields: newFields } };
    });
  };

  // 회원탈퇴 처리
  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "회원탈퇴") {
      alert("'회원탈퇴'를 정확히 입력해주세요.");
      return;
    }

    setIsDeleting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('로그인이 필요합니다.');
        return;
      }

      const response = await fetch('/api/auth/delete-account', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '회원탈퇴에 실패했습니다.');
      }

      // 로그아웃 처리
      await supabase.auth.signOut();
      
      alert('계정이 성공적으로 삭제되었습니다. 이용해주셔서 감사합니다.');
      window.location.href = '/'; 
      
    } catch (error) {
      console.error('회원탈퇴 실패:', error);
      alert(error instanceof Error ? error.message : '회원탈퇴에 실패했습니다.');
    } finally {
      setIsDeleting(false);
      setDeleteModalOpen(false);
      setDeleteConfirmText("");
    }
  };

  if (!mounted || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 pt-24">
      <div className="max-w-4xl mx-auto px-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            프로필 설정
          </h1>
          <p className="text-gray-600">
            나의 정보를 관리하고 다른 사용자에게 보여질 프로필을 설정하세요
          </p>
        </div>

        {/* 커버 이미지 설정 */}
        <Card className="mb-6">
            <CardHeader>
              <CardTitle>커버 이미지</CardTitle>
            </CardHeader>
            <CardContent>
               <div className="aspect-[3/1] bg-gray-100 rounded-lg overflow-hidden relative mb-4 group">
                  {profile.coverImage ? (
                    <img src={profile.coverImage} alt="Cover" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-center text-white/50">
                       <p>이미지가 없습니다</p>
                    </div>
                  )}
                  <label className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleCoverImageUpload}
                        className="hidden" 
                      />
                      <div className="bg-white/90 text-gray-800 px-4 py-2 rounded-full flex items-center gap-2 font-medium">
                        <Upload size={16} />
                        이미지 변경
                      </div>
                  </label>
               </div>
               <p className="text-sm text-gray-500">
                 프로필 페이지 상단 배경으로 사용됩니다. (권장 비율 3:1, 최대 5MB)
               </p>
            </CardContent>
        </Card>

        {/* 프로필 이미지 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>프로필 이미지</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <Avatar className="w-24 h-24">
                <img
                  src={profile.profileImage}
                  alt="프로필"
                  className="w-full h-full object-cover"
                />
              </Avatar>
              <div>
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <Button variant="outline" asChild>
                    <span>
                      <Upload size={18} className="mr-2" />
                      이미지 업로드
                    </span>
                  </Button>
                </label>
                <p className="text-sm text-gray-500 mt-2">
                  JPG, PNG 파일 (최대 5MB)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 기본 정보 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>기본 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User size={16} className="inline mr-1" />
                사용자 이름
              </label>
              <Input
                placeholder="홍길동"
                value={profile.username}
                onChange={(e) =>
                  setProfile({ ...profile, username: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Mail size={16} className="inline mr-1" />
                이메일
              </label>
              <Input
                type="email"
                placeholder="example@email.com"
                value={profile.email}
                onChange={(e) =>
                  setProfile({ ...profile, email: e.target.value })
                }
                disabled // 이메일은 수정 불가
              />
            </div>
            {/* 전화번호, 위치 필드 삭제됨 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                소개
              </label>
              <Textarea
                placeholder="자신을 소개해주세요..."
                value={profile.bio}
                onChange={(e) =>
                  setProfile({ ...profile, bio: e.target.value })
                }
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* 관심 장르 및 분야 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>관심 장르 및 분야 (설정)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 관심 장르 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                관심 장르 (최소 1개, 최대 5개)
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {GENRE_CATEGORIES.map((genre) => {
                  const isSelected = profile.interests?.genres?.includes(genre.value) || false;
                  return (
                    <button
                      type="button"
                      key={genre.value}
                      onClick={() => toggleGenre(genre.value)}
                      className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                        isSelected
                          ? "border-green-600 text-green-600 bg-green-50"
                          : "border-gray-200 text-gray-500 hover:border-gray-300"
                      }`}
                    >
                      <FontAwesomeIcon icon={genre.icon} className="w-6 h-6 mb-2" />
                      <span className="text-sm font-medium">{genre.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <Separator />

            {/* 관심 분야 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                관심 분야 (선택, 최대 3개)
              </label>
              <div className="flex flex-wrap gap-2">
                {FIELD_CATEGORIES.map((field) => {
                   const isSelected = profile.interests?.fields?.includes(field.value) || false;
                   return (
                    <button
                      type="button"
                      key={field.value}
                      onClick={() => toggleField(field.value)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                        isSelected
                          ? "bg-[#6A5ACD] text-white"
                          : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {field.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 스킬 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>스킬</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="스킬을 입력하세요 (예: UI/UX 디자인)"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddSkill();
                  }
                }}
              />
              <Button onClick={handleAddSkill}>추가</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {(profile.skills || []).map((skill, idx) => (
                <div
                  key={idx}
                  className="bg-green-600 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2"
                >
                  {skill}
                  <button
                    onClick={() => handleRemoveSkill(skill)}
                    className="hover:text-gray-200"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 소셜 링크 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>소셜 링크</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <LinkIcon size={16} className="inline mr-1" />
                웹사이트
              </label>
              <Input
                placeholder="https://yourwebsite.com"
                value={profile.website}
                onChange={(e) =>
                  setProfile({ ...profile, website: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Instagram
              </label>
              <Input
                placeholder="https://instagram.com/username"
                value={profile.socialLinks.instagram || ""}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    socialLinks: {
                      ...profile.socialLinks,
                      instagram: e.target.value,
                    },
                  })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Behance
              </label>
              <Input
                placeholder="https://behance.net/username"
                value={profile.socialLinks.behance || ""}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    socialLinks: {
                      ...profile.socialLinks,
                      behance: e.target.value,
                    },
                  })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                LinkedIn
              </label>
              <Input
                placeholder="https://linkedin.com/in/username"
                value={profile.socialLinks.linkedin || ""}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    socialLinks: {
                      ...profile.socialLinks,
                      linkedin: e.target.value,
                    },
                  })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* 계정 관리 (회원탈퇴) */}
        <Card className="mb-6 border-red-100">
           <CardHeader>
             <CardTitle className="text-red-600">계정 관리</CardTitle>
           </CardHeader>
           <CardContent>
              <div className="flex items-center justify-between">
                 <div>
                    <h4 className="font-medium text-gray-900">회원 탈퇴</h4>
                    <p className="text-sm text-gray-500 mt-1">계정을 삭제하면 복구할 수 없습니다.</p>
                 </div>
                 <Button 
                   variant="destructive" 
                   onClick={() => setDeleteModalOpen(true)}
                 >
                   회원 탈퇴하기
                 </Button>
              </div>
           </CardContent>
        </Card>



        {/* 저장 버튼 */}
        <div className="flex gap-4 justify-end">
          <Button variant="outline" onClick={() => window.history.back()}>
            취소
          </Button>
          <Button
            onClick={handleSave}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            저장
          </Button>
        </div>
      </div>
      {/* 회원탈퇴 확인 모달 */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <DialogTitle className="text-xl text-red-600">회원탈퇴</DialogTitle>
                <DialogDescription className="text-sm text-gray-500">
                  이 작업은 되돌릴 수 없습니다.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-semibold text-red-800 mb-2">⚠️ 삭제되는 데이터</h4>
              <ul className="text-sm text-red-700 space-y-1">
                <li>• 업로드한 모든 프로젝트</li>
                <li>• 좋아요, 댓글, 팔로우 기록</li>
                <li>• 컬렉션 및 저장된 항목</li>
                <li>• 받은 제안 및 메시지</li>
                <li>• 프로필 정보</li>
              </ul>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                탈퇴를 확인하기 위해 아래에 <span className="font-bold text-red-600">"회원탈퇴"</span>를 입력해주세요.
              </label>
              <Input
                placeholder="회원탈퇴"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                className="border-red-300 focus:ring-red-500"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
              취소
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteAccount}
              disabled={deleteConfirmText !== "회원탈퇴" || isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "처리중..." : "탈퇴하기"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
