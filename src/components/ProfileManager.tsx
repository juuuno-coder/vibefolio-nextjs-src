"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase/client";
import { Loader2, Globe, Github, Twitter, Instagram, Settings, Check, X, Copy, ExternalLink, Eye, EyeOff } from "lucide-react";

interface ProfileManagerProps {
  user: any; // 현재 사용자 정보
  onUpdate: () => void; // 업데이트 완료 시 부모에게 알림
}

export function ProfileManager({ user, onUpdate }: ProfileManagerProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  
  const [isPublic, setIsPublic] = useState(true);

  const [formData, setFormData] = useState({
    username: "",
    bio: "",
    website: "",
    github: "",
    twitter: "",
    instagram: "",
  });

  // 초기 데이터 로드
  useEffect(() => {
    if (user && open) {
      setFormData({
        username: user.username || "",
        bio: user.bio || "",
        website: user.social_links?.website || "",
        github: user.social_links?.github || "",
        twitter: user.social_links?.twitter || "",
        instagram: user.social_links?.instagram || "",
      });
      // undefined인 경우(기존 데이터) 기본값 true
      setIsPublic(user.is_public !== false);
      setUsernameAvailable(null);
    }
  }, [user, open]);

  // Username 중복 체크
  const checkUsername = async (username: string) => {
    if (!username || username === user.username) {
      setUsernameAvailable(null);
      return;
    }
    
    // 유효성 검사 (영문, 숫자, 밑줄, 하이픈, 3자 이상)
    if (!/^[a-zA-Z0-9_-]{3,}$/.test(username)) {
      setUsernameAvailable(false);
      return;
    }

    // 예약어 체크
    const reserved = ['admin', 'api', 'login', 'signup', 'mypage', 'auth', 'project', 'recruit'];
    if (reserved.includes(username)) {
      setUsernameAvailable(false);
      return;
    }

    setChecking(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username)
        .neq('id', user.id) // 내 아이디는 제외
        .maybeSingle(); 

      setUsernameAvailable(!data); // 데이터가 없으면 사용 가능
    } catch (error) {
      console.error('Check username error:', error);
      setUsernameAvailable(false);
    } finally {
      setChecking(false);
    }
  };

  // 저장 핸들러
  const handleSave = async () => {
    if (usernameAvailable === false) {
      toast.error("사용할 수 없는 아이디입니다.");
      return;
    }

    setLoading(true);
    try {
      const social_links = {
        website: formData.website,
        github: formData.github,
        twitter: formData.twitter,
        instagram: formData.instagram,
      };

      const { error } = await supabase
        .from('profiles')
        .update({
          username: formData.username,
          bio: formData.bio,
          social_links: social_links,
          is_public: isPublic,
        })
        .eq('id', user.id);

      if (error) throw error;

      toast.success("프로필이 업데이트되었습니다!");
      setOpen(false);
      onUpdate();
    } catch (error: any) {
      console.error('Profile update error:', error);
      toast.error(error.message || "프로필 업데이트 실패");
    } finally {
      setLoading(false);
    }
  };

  const profileUrl = typeof window !== 'undefined' ? `${window.location.origin}/${formData.username}` : '';

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Settings className="w-4 h-4" />
          프로필 설정
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>프로필 설정</DialogTitle>
          <DialogDescription>
            공개 프로필 페이지에 표시될 정보를 설정합니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
           {/* 공개 여부 스위치 */}
           <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
             <div className="flex items-center gap-3">
               <div className={`p-2 rounded-full ${isPublic ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-500'}`}>
                 {isPublic ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
               </div>
               <div>
                 <Label className="text-base font-bold text-gray-900 cursor-pointer" onClick={() => setIsPublic(!isPublic)}>프로필 공개</Label>
                 <p className="text-sm text-gray-500">
                   {isPublic 
                     ? "누구나 내 프로필 페이지를 볼 수 있습니다." 
                     : "나만 내 프로필을 볼 수 있습니다."}
                 </p>
               </div>
             </div>
             <Switch checked={isPublic} onCheckedChange={setIsPublic} />
           </div>

          {/* 1. 기본 정보 */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">아이디 (URL)</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-2.5 text-gray-500 text-sm">vibefolio.net/</span>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => {
                      const val = e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''); // 특수문자 입력 방지
                      setFormData({ ...formData, username: val });
                      checkUsername(val);
                    }}
                    className="pl-[105px]"
                    placeholder="username"
                  />
                  {/* 상태 아이콘 */}
                  <div className="absolute right-3 top-2.5">
                    {checking ? (
                      <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                    ) : usernameAvailable === true ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : usernameAvailable === false ? (
                      <X className="w-4 h-4 text-red-500" />
                    ) : null}
                  </div>
                </div>
              </div>
              {usernameAvailable === false && (
                <p className="text-xs text-red-500">이미 사용 중이거나 사용할 수 없는 아이디입니다. (3자 이상)</p>
              )}
              {formData.username && usernameAvailable !== false && (
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-xs text-green-600">
                    내 포트폴리오 주소: <strong>{profileUrl}</strong>
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => {
                      navigator.clipboard.writeText(profileUrl);
                      toast.success("주소가 복사되었습니다");
                    }}
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                  <a href={`/${formData.username}`} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-3 h-3 text-gray-400 hover:text-blue-500" />
                  </a>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">한줄 소개 (Bio)</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="나를 소개하는 짧은 글을 작성해보세요."
                rows={3}
                className="resize-none"
              />
            </div>
          </div>

          <div className="h-px bg-gray-100" />

          {/* 2. 소셜 링크 */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900">소셜 링크</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="website" className="flex items-center gap-2">
                  <Globe className="w-4 h-4" /> 웹사이트
                </Label>
                <Input
                  id="website"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="github" className="flex items-center gap-2">
                  <Github className="w-4 h-4" /> GitHub
                </Label>
                <Input
                  id="github"
                  value={formData.github}
                  onChange={(e) => setFormData({ ...formData, github: e.target.value })}
                  placeholder="GitHub 프로필 URL"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="twitter" className="flex items-center gap-2">
                  <Twitter className="w-4 h-4" /> X (Twitter)
                </Label>
                <Input
                  id="twitter"
                  value={formData.twitter}
                  onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
                  placeholder="X 프로필 URL"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="instagram" className="flex items-center gap-2">
                  <Instagram className="w-4 h-4" /> Instagram
                </Label>
                <Input
                  id="instagram"
                  value={formData.instagram}
                  onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                  placeholder="Instagram 프로필 URL"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-4">
          <Button variant="outline" onClick={() => setOpen(false)}>취소</Button>
          <Button onClick={handleSave} disabled={loading || usernameAvailable === false} className="bg-green-600 hover:bg-green-700">
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                저장 중...
              </>
            ) : "변경사항 저장"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
