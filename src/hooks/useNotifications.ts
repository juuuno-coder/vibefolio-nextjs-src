"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import { RealtimeChannel } from "@supabase/supabase-js";
import { useAuth } from "@/lib/auth/AuthContext";

export interface Notification {
  id: string;
  type: "like" | "comment" | "follow" | "mention" | "system";
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: string;
  sender?: {
    id: string;
    nickname: string;
    profileImage?: string;
  };
}

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearAll: () => void;
}

/**
 * 실시간 알림 훅
 */
export function useNotifications(): UseNotificationsReturn {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 알림 로드
  const loadNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setIsLoading(false);
      return;
    }

    try {
      // 1. 알림 데이터 조회 (Join 없이)
      // DB Foreign Key 문제(PGRST200)를 회피하기 위해 Application-level Join 사용
      const { data, error } = await supabase
        .from("notifications")
        .select(`
          id,
          type,
          title,
          message,
          link,
          read,
          created_at,
          sender_id
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      // 2. sender_id 수집
      const notifs = data || [];
      const senderIds = Array.from(new Set(notifs.map((n: any) => n.sender_id).filter(Boolean))) as string[];

      // 3. 프로필 정보 조회 (Application-level Join)
      let sendersMap: Record<string, any> = {};
      if (senderIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, username, profile_image_url')
          .in('id', senderIds);
        
        if (profiles) {
          profiles.forEach((p: any) => {
            sendersMap[p.id] = p;
          });
        }
      }

      // 4. 데이터 병합
      const formatted: Notification[] = notifs.map((n: any) => {
        const senderProfile = n.sender_id ? sendersMap[n.sender_id] : null;
        return {
          id: n.id,
          type: n.type,
          title: n.title,
          message: n.message,
          link: n.link,
          read: n.read,
          createdAt: n.created_at,
          sender: senderProfile ? {
            id: senderProfile.id,
            nickname: senderProfile.username || '알 수 없음',
            profileImage: senderProfile.profile_image_url,
          } : undefined,
        };
      });

      setNotifications(formatted);
    } catch (error) {
      console.error("[Notifications] 로드 실패:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // 읽음 처리
  const markAsRead = useCallback(async (id: string) => {
    if (!user) return;

    try {
      await (supabase
        .from("notifications") as any)
        .update({ read: true })
        .eq("id", id);

      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (error) {
      console.error("[Notifications] 읽음 처리 실패:", error);
    }
  }, [user]);

  // 전체 읽음 처리
  const markAllAsRead = useCallback(async () => {
    if (!user) return;

    try {
      await (supabase
        .from("notifications") as any)
        .update({ read: true })
        .eq("user_id", user.id)
        .eq("read", false);

      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read: true }))
      );
    } catch (error) {
      console.error("[Notifications] 전체 읽음 처리 실패:", error);
    }
  }, [user]);

  // 전체 삭제
  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // 실시간 구독
  useEffect(() => {
    if (!user) return;

    loadNotifications();

    // Realtime 채널 구독
    const channel: RealtimeChannel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log("[Notifications] 새 알림:", payload);
          // 새 알림 추가
          const newNotification: Notification = {
            id: payload.new.id,
            type: payload.new.type,
            title: payload.new.title,
            message: payload.new.message,
            link: payload.new.link,
            read: payload.new.read,
            createdAt: payload.new.created_at,
          };
          setNotifications((prev) => [newNotification, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, loadNotifications]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    clearAll,
  };
}

/**
 * 알림 생성 함수 (서버 사이드에서 호출)
 */
export async function createNotification({
  userId,
  type,
  title,
  message,
  link,
  senderId,
}: {
  userId: string;
  type: Notification["type"];
  title: string;
  message: string;
  link?: string;
  senderId?: string;
}) {
  try {
    const { error } = await (supabase.from("notifications") as any).insert({
      user_id: userId,
      type,
      title,
      message,
      link,
      sender_id: senderId,
      read: false,
    });

    if (error) throw error;
  } catch (error) {
    console.error("[Notifications] 생성 실패:", error);
  }
}
