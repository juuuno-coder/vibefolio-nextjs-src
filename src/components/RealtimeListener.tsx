"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { useAdmin } from "@/hooks/useAdmin";

// 알림 설정 인터페이스 (전역 관리를 위해 localStorage 사용)
export interface NotificationSettings {
  projects: boolean;
  recruit: boolean;
  likes: boolean;
  proposals: boolean;
  notices: boolean;
  adminInquiries: boolean;
  adminSignups: boolean;
}

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  projects: true,
  recruit: true,
  likes: true,
  proposals: true,
  notices: true,
  adminInquiries: true,
  adminSignups: true,
};

/**
 * 실시간 DB 알림 리스너 (UI 없음)
 */
export default function RealtimeListener() {
  const router = useRouter();
  const { user, userProfile } = useAuth();
  const { isAdmin } = useAdmin();
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_NOTIFICATION_SETTINGS);

  // 설정 로드
  useEffect(() => {
    const loadSettings = () => {
      const saved = localStorage.getItem("notification_settings");
      if (saved) {
        try {
          setSettings({ ...DEFAULT_NOTIFICATION_SETTINGS, ...JSON.parse(saved) });
        } catch (e) {
          console.error("Failed to parse settings", e);
        }
      }
    };

    loadSettings();
    // 설정 변경 감지를 위해 storage 이벤트 리스너 추가
    window.addEventListener("storage", loadSettings);
    // 커스텀 이벤트 감지 (동일 탭 내 변경)
    window.addEventListener("notificationSettingsChanged", loadSettings);
    
    return () => {
      window.removeEventListener("storage", loadSettings);
      window.removeEventListener("notificationSettingsChanged", loadSettings);
    };
  }, []);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('vibefolio_realtime_stream_v4')
      
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
          if (userInterests.length === 0) return;

          const { data: category } = await (supabase as any)
            .from('Category')
            .select('name')
            .eq('category_id', payload.new.category_id)
            .single();

          if (category && userInterests.includes(category.name)) {
            toast.success("🚀 관심 프로젝트 등장!", {
              description: payload.new.title,
              action: { label: "보기", onClick: () => router.push(`/project/${payload.new.project_id}`) }
            });
          }
        }
      )

      // 3. 신규 연결하기 (Recruit/Contest) - 관심사 기반
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'recruit_items' },
        (payload) => {
          if (!settings.recruit) return;
          // 승인되지 않은 건 알림 안줌
          if (!payload.new.is_approved) return;

          const userInterests = userProfile?.interests?.fields || []; // 연결하기는 fields(분야) 중심
          const itemTitle = payload.new.title || "";
          const itemDesc = payload.new.description || "";
          
          // 제목이나 설명에 관심 키워드가 포함되어 있는지 간단 체크
          const hasInterest = userInterests.some(interest => 
            itemTitle.includes(interest) || itemDesc.includes(interest)
          );

          if (hasInterest || userInterests.length === 0) {
            toast("🤝 새로운 연결 기회!", {
              description: itemTitle,
              action: { label: "상세보기", onClick: () => router.push('/recruit') },
              style: { borderLeft: '4px solid #16A34A' }
            });
          }
        }
      )

      // 4. 좋아요 (내 게시물)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'Like' },
        async (payload) => {
          if (!settings.likes) return;
          
          const { data: project } = await (supabase as any)
            .from('Project')
            .select('user_id, title')
            .eq('project_id', payload.new.project_id)
            .single();

          if (project?.user_id === user.id) {
            toast.success("❤️ 내 프로젝트에 좋아요!", {
              description: `'${project.title}'`
            });
          }
        }
      )

      // 5. 제안하기 (수신자 확인)
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

    // 6. 관리자 알림
    if (isAdmin) {
      channel
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'inquiries' },
          (payload) => {
            if (!settings.adminInquiries) return;
            toast("✉️ [Admin] 새 문의", {
              description: payload.new.message?.substring(0, 20),
              action: { label: "이동", onClick: () => router.push('/admin/inquiries') }
            });
          }
        )
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'profiles' },
          (payload) => {
            if (!settings.adminSignups) return;
            toast("👤 [Admin] 신규 가입", {
              description: `${payload.new.username}님`,
              action: { label: "관리", onClick: () => router.push('/admin/users') }
            });
          }
        );
    }

    channel.subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [router, user, userProfile, isAdmin, settings]);

  return null; // UI는 NotificationBell로 통합
}
