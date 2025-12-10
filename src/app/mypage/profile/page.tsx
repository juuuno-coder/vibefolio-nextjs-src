// src/app/mypage/profile/page.tsx

"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { User, Mail, Phone, MapPin, Link as LinkIcon, Upload } from "lucide-react";

interface UserProfile {
  username: string;
  email: string;
  phone: string;
  bio: string;
  location: string;
  website: string;
  profileImage: string;
  skills: string[];
  socialLinks: {
    instagram?: string;
    behance?: string;
    linkedin?: string;
  };
}

import { supabase } from "@/lib/supabase/client";

// ... (interface 유지)

export default function ProfileSettingsPage() {
  const [profile, setProfile] = useState<UserProfile>({
    // ... 초기값 유지
    username: "",
    email: "",
    phone: "",
    bio: "",
    location: "",
    website: "",
    profileImage: "/globe.svg",
    skills: [],
    socialLinks: {},
  });
  const [newSkill, setNewSkill] = useState("");
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // 프로필 불러오기
  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('로그인이 필요합니다.');
        window.location.href = '/login';
        return;
      }

      setUserId(user.id);

      try {
        const response = await fetch(`/api/users/${user.id}`);
        const data = await response.json();

        if (response.ok && data.user) {
          setProfile({
            username: data.user.nickname || '',
            email: data.user.email || '',
            phone: '',
            bio: data.user.bio || '',
            location: '',
            website: '',
            profileImage: data.user.profile_image_url || '/globe.svg',
            skills: [],
            socialLinks: {},
          });
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

  // ... useEffect (생략)

  // 프로필 저장
  const handleSave = async () => {
    if (!userId) return;

    try {
      let imageUrl = profile.profileImage;

      // 이미지가 새로 업로드되었다면 Supabase Storage에 업로드
      if (imageFile) {
        // dynamic import to avoid circular dependency or use direct import if clean
        const { uploadImage } = await import("@/lib/supabase/storage");
        imageUrl = await uploadImage(imageFile, 'profiles');
      }

      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nickname: profile.username,
          bio: profile.bio,
          profile_image_url: imageUrl,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // localStorage 업데이트는 이제 불필요할 수 있으나 호환성을 위해 유지
        // ...
        alert('프로필이 저장되었습니다!');
      } else {
        alert(data.error || '프로필 저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('프로필 저장 실패:', error);
      alert('프로필 저장 중 오류가 발생했습니다.');
    }
  };

  // 프로필 이미지 선택
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 5MB 제한
      if (file.size > 5 * 1024 * 1024) {
        alert("이미지 크기는 5MB 이하여야 합니다.");
        return;
      }
      
      setImageFile(file);
      
      // 미리보기 생성
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile({ ...profile, profileImage: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

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
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Phone size={16} className="inline mr-1" />
                전화번호
              </label>
              <Input
                placeholder="010-1234-5678"
                value={profile.phone}
                onChange={(e) =>
                  setProfile({ ...profile, phone: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin size={16} className="inline mr-1" />
                위치
              </label>
              <Input
                placeholder="서울, 대한민국"
                value={profile.location}
                onChange={(e) =>
                  setProfile({ ...profile, location: e.target.value })
                }
              />
            </div>
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
              {profile.skills.map((skill, idx) => (
                <div
                  key={idx}
                  className="bg-[#4ACAD4] text-white px-3 py-1 rounded-full text-sm flex items-center gap-2"
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

        {/* 저장 버튼 */}
        <div className="flex gap-4 justify-end">
          <Button variant="outline" onClick={() => window.history.back()}>
            취소
          </Button>
          <Button
            onClick={handleSave}
            className="bg-[#4ACAD4] hover:bg-[#41a3aa]"
          >
            저장
          </Button>
        </div>
      </div>
    </div>
  );
}
