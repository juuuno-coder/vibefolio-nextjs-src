"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { useAdmin } from "@/hooks/useAdmin";
import { Settings, Bell, Heart, Send, Info, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface NotificationSettings {
  projects: boolean;
  likes: boolean;
  proposals: boolean;
  notices: boolean;
  adminInquiries: boolean;
  adminSignups: boolean;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  projects: true,
  likes: true,
  proposals: true,
  notices: true,
  adminInquiries: true,
  adminSignups: true,
};

export default function RealtimeListener() {
  const router = useRouter();
  const { user, userProfile } = useAuth();
  const { isAdmin } = useAdmin();
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS);
  const [isOpen, setIsOpen] = useState(false);

  // 설정 로드
  useEffect(() => {
    const saved = localStorage.getItem("notification_settings");
    if (saved) {
      try {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(saved) });
      } catch (e) {
        console.error("Failed to parse settings", e);
      }
    }
  }, []);

  // 설정 저장
  const updateSetting = (key: keyof NotificationSettings, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    localStorage.setItem("notification_settings", JSON.stringify(newSettings));
  };

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('vibefolio_realtime_stream')
      
      // 1. 공지사항
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notices' },
        (payload) => {
          if (!settings.notices) return;
          toast.info("📢 신규 공지", {
            description: payload.new.title,
            action: { label: "보기", onClick: () => router.push('/notices') }
          });
        }
      )
      
      // 2. 신규 프로젝트 (관심사 필터링)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'Project' },
        async (payload) => {
          if (!settings.projects) return;
          if (payload.new.user_id === user.id) return;

          const userInterests = userProfile?.interests?.genres || [];
          if (userInterests.length === 0) return; // 관심사 없으면 알림 안줌

          // 카테고리 명칭 확인
          const { data: category } = await (supabase as any)
            .from('Category')
            .select('name')
            .eq('category_id', payload.new.category_id)
            .single();

          if (category && userInterests.includes(category.name)) {
            toast.success("🚀 관심 장르 새 프로젝트!", {
              description: payload.new.title,
              action: { label: "보기", onClick: () => router.push(`/project/${payload.new.project_id}`) }
            });
          }
        }
      )

      // 3. 좋아요 (내 게시물)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'Like' },
        async (payload) => {
          if (!settings.likes) return;
          
          // 프로젝트 소유자 확인
          const { data: project } = await (supabase as any)
            .from('Project')
            .select('user_id, title')
            .eq('project_id', payload.new.project_id)
            .single();

          if (project?.user_id === user.id) {
            toast.success("❤️ 내 프로젝트에 좋아요!", {
              description: `'${project.title}' 소식`
            });
          }
        }
      )

      // 4. 제안하기 (수신자 확인)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'Proposal' },
        (payload) => {
          if (!settings.proposals) return;
          if (payload.new.receiver_id === user.id) {
            toast.success("✉️ 새로운 제안 도착", {
              description: payload.new.title,
              action: { label: "확인", onClick: () => router.push('/mypage') }
            });
          }
        }
      );

    // 5. 관리자 알림
    if (isAdmin) {
      channel
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'inquiries' },
          (payload) => {
            if (!settings.adminInquiries) return;
            toast("✉️ [Admin] 새 문의 접수", {
              description: payload.new.message?.substring(0, 20) + "...",
              action: { label: "이동", onClick: () => router.push('/admin/inquiries') }
            });
          }
        )
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'profiles' },
          (payload) => {
            if (!settings.adminSignups) return;
            toast("👤 [Admin] 신규 유저", {
              description: `${payload.new.username || '익명'}님 가입`,
              action: { label: "이동", onClick: () => router.push('/admin/users') }
            });
          }
        );
    }

    channel.subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [router, user, userProfile, isAdmin, settings]);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            size="icon" 
            className="w-12 h-12 rounded-full shadow-xl bg-white/90 backdrop-blur-md hover:scale-105 transition-all border-gray-200"
          >
            <Bell className="w-5 h-5 text-[#16A34A]" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-5 mr-4 mb-2 rounded-3xl shadow-2xl border-gray-100 bg-white/95 backdrop-blur-xl" side="top">
          <div className="space-y-5">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h4 className="font-black text-lg flex items-center gap-2 italic tracking-tighter text-slate-800">
                <Settings className="w-5 h-5 text-gray-400" /> NOTIF SETTINGS
              </h4>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between group">
                <div className="space-y-0.5">
                  <Label className="text-[13px] font-bold text-gray-700">신규 프로젝트</Label>
                  <p className="text-[10px] text-gray-400">내 관심사 장르 기반</p>
                </div>
                <Switch 
                  checked={settings.projects}
                  onCheckedChange={(v: boolean) => updateSetting('projects', v)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-[13px] font-bold text-gray-700">내 포스트 좋아요</Label>
                <Switch 
                  checked={settings.likes}
                  onCheckedChange={(v: boolean) => updateSetting('likes', v)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-[13px] font-bold text-gray-700">받은 제안 알림</Label>
                <Switch 
                  checked={settings.proposals}
                  onCheckedChange={(v: boolean) => updateSetting('proposals', v)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-[13px] font-bold text-gray-700">공지사항 알림</Label>
                <Switch 
                  checked={settings.notices}
                  onCheckedChange={(v: boolean) => updateSetting('notices', v)}
                />
              </div>

              {isAdmin && (
                <div className="pt-4 border-t border-gray-100 space-y-4">
                  <p className="text-[9px] font-black text-green-600 uppercase tracking-widest bg-green-50 w-fit px-2 py-0.5 rounded-full">Admin Section</p>
                  <div className="flex items-center justify-between">
                    <Label className="text-[13px] font-bold text-gray-700">1:1 문의 접수</Label>
                    <Switch 
                      checked={settings.adminInquiries}
                      onCheckedChange={(v: boolean) => updateSetting('adminInquiries', v)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-[13px] font-bold text-gray-700">신규 회원 가입</Label>
                    <Switch 
                      checked={settings.adminSignups}
                      onCheckedChange={(v: boolean) => updateSetting('adminSignups', v)}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
