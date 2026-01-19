"use client";

import { useState, useEffect } from "react";
import { 
  Bell, 
  Check, 
  Heart, 
  MessageCircle, 
  UserPlus, 
  AtSign, 
  Info, 
  Briefcase, 
  Rocket,
  Sparkles,
  FlaskConical,
  Upload,
  User as UserIcon,
  LayoutDashboard,
  LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useNotifications, Notification, createNotification } from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useAdmin } from "@/hooks/useAdmin";
import { useAuth } from "@/lib/auth/AuthContext";
import { toast } from "sonner";
import { DEFAULT_NOTIFICATION_SETTINGS, NotificationSettings } from "./RealtimeListener";

import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/ko";

dayjs.extend(relativeTime);
dayjs.locale("ko");

// 알림 타입별 아이콘 및 스타일
const notificationStyles = {
  like: { icon: Heart, color: "text-red-500", bg: "bg-red-50" },
  comment: { icon: MessageCircle, color: "text-blue-500", bg: "bg-blue-50" },
  follow: { icon: UserPlus, color: "text-green-600", bg: "bg-green-50" },
  mention: { icon: AtSign, color: "text-purple-500", bg: "bg-purple-50" },
  system: { icon: Info, color: "text-gray-500", bg: "bg-gray-50" },
};

// 시간 포맷 (Day.js 적용)
function formatTime(dateStr: string): string {
  const date = dayjs(dateStr);
  const now = dayjs();
  const diffInSecond = now.diff(date, "second");
  const diffInMinutes = now.diff(date, "minute");
  const diffInHours = now.diff(date, "hour");
  const diffInDays = now.diff(date, "day");

  // 1분 미만: '방금'
  if (diffInSecond < 60) return "방금";
  // 1시간 미만: 'n분 전'
  if (diffInMinutes < 60) return `${diffInMinutes}분 전`;
  // 24시간 미만: 'n시간 전'
  if (diffInHours < 24) return `${diffInHours}시간 전`;
  // 7일 미만: 'n일 전'
  if (diffInDays < 7) return `${diffInDays}일 전`;
  // 그 외: 날짜 표시
  return date.format("YYYY.MM.DD");
}

interface NotificationItemProps {
  notification: Notification;
  onRead: (id: string) => void;
}

function NotificationItem({ notification, onRead }: NotificationItemProps) {
  const style = notificationStyles[notification.type] || notificationStyles.system;
  const Icon = style.icon;

  const content = (
    <div
      className={cn(
        "flex items-start gap-4 p-4 rounded-xl cursor-pointer transition-all duration-200 group relative overflow-hidden",
        notification.read
          ? "bg-white hover:bg-gray-50"
          : "bg-green-50/40 hover:bg-green-50/70 shadow-sm border border-green-100/50"
      )}
      onClick={() => !notification.read && onRead(notification.id)}
    >
      <div
        className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm border border-white/50",
          style.bg,
          style.color
        )}
      >
        <Icon className="w-5 h-5" />
      </div>

      <div className="flex-1 min-w-0 pt-0.5">
        <p className={cn("text-sm font-semibold truncate", notification.read ? "text-gray-700" : "text-gray-900")}>
          {notification.title}
        </p>
        <p className="text-xs text-gray-500 line-clamp-2 mt-1 leading-relaxed">
          {notification.message}
        </p>
        <p className="text-[10px] text-gray-400 mt-1.5 font-medium flex items-center justify-between">
          <span>{formatTime(notification.createdAt)}</span>
          {notification.action_label && notification.action_url && (
             <Button 
                size="sm" 
                variant="default"
                className="h-6 text-[10px] px-2 bg-green-600 hover:bg-green-700 text-white shadow-sm ml-2 shrink-0"
                onClick={(e) => {
                    e.stopPropagation(); // prevent parent click
                    e.preventDefault();
                    if (!notification.read) onRead(notification.id);
                    window.location.href = notification.action_url!;
                }}
             >
                {notification.action_label}
             </Button>
          )}
        </p>
      </div>

      {!notification.read && (
        <div className="absolute top-4 right-4 w-2 h-2 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
      )}
    </div>
  );

  if (notification.link) {
    return <Link href={notification.link} className="block">{content}</Link>;
  }

  return content;
}

export function NotificationBell() {
  const { user } = useAuth();
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
  } = useNotifications();
  const { isAdmin } = useAdmin();
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_NOTIFICATION_SETTINGS);

  // 설정 로드
  useEffect(() => {
    const saved = localStorage.getItem("notification_settings");
    if (saved) {
      try {
        setSettings({ ...DEFAULT_NOTIFICATION_SETTINGS, ...JSON.parse(saved) });
      } catch (e) {
        console.error("Failed to parse settings", e);
      }
    }
  }, []);

  const updateSetting = (key: keyof NotificationSettings, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    localStorage.setItem("notification_settings", JSON.stringify(newSettings));
    window.dispatchEvent(new CustomEvent("notificationSettingsChanged"));
  };

  const handleTestNotification = async () => {
    if (!user) return;
    try {
      toast.loading("서버에 알림 요청 중...");
      const res = await fetch('/api/test-notification', { method: 'POST' });
      if (!res.ok) throw new Error('API Error');
      
      // 성공 메시지는 Realtime 이벤트가 오면 뜹니다.
      // toast.success("테스트 알림을 보냈습니다! (도착을 기다려주세요)");
    } catch (e) {
      toast.error("알림 요청 실패");
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative w-10 h-10 rounded-full hover:bg-green-50 transition-all active:scale-95 group"
          aria-label="알림 센터"
        >
          <Bell className={cn(
            "w-[22px] h-[22px] transition-colors", 
            unreadCount > 0 
              ? "text-green-600 fill-green-100 animate-pulse-gentle" 
              : "text-gray-600 group-hover:text-green-600"
          )} />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold ring-2 ring-white shadow-sm">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent 
        align="end" 
        className="w-[380px] p-0 overflow-hidden rounded-2xl border-2 border-gray-100 shadow-2xl bg-white"
        sideOffset={12}
        style={{ zIndex: 99999 }}
      >
        <Tabs defaultValue="activity" className="w-full">
          <div className="px-5 pt-5 pb-3 flex items-center justify-between border-b border-gray-50/50 bg-white/50 backdrop-blur-sm sticky top-0 z-10">
            <TabsList className="bg-gray-100/80 p-1 h-9 rounded-xl gap-1">
              <TabsTrigger value="activity" className="rounded-lg px-4 h-7 text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-green-600 data-[state=active]:shadow-sm transition-all">
                활동
              </TabsTrigger>
              <TabsTrigger value="settings" className="rounded-lg px-4 h-7 text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm transition-all">
                설정
              </TabsTrigger>
            </TabsList>
            
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-[11px] text-gray-500 hover:text-green-600 hover:bg-green-50 font-bold rounded-lg px-2"
                onClick={markAllAsRead}
                disabled={unreadCount === 0}
              >
                <Check className="w-3.5 h-3.5 mr-1.5" />
                모두 읽음
              </Button>
            </div>
          </div>

          <TabsContent value="activity" className="m-0 focus-visible:outline-none">
            <div className="max-h-[460px] min-h-[300px] overflow-y-auto custom-scrollbar p-2 relative">
              {isLoading ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                  <div className="animate-spin w-8 h-8 border-[3px] border-gray-100 border-t-green-500 rounded-full" />
                  <p className="text-xs text-gray-400 font-medium animate-pulse">알림을 불러오고 있어요...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
                  <div className="w-20 h-20 bg-gradient-to-br from-green-50 to-blue-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
                    <Sparkles className="w-10 h-10 text-green-400" />
                  </div>
                  <p className="text-base font-bold text-gray-600">아직 도착한 알림이 없어요</p>
                  <p className="text-xs text-gray-400 mt-2 max-w-[200px] leading-relaxed">
                    프로젝트를 업로드하거나<br/>다른 크리에이터와 소통해보세요!
                  </p>
                  <Link href="/project/upload" onClick={() => setOpen(false)}>
                    <Button 
                      variant="outline" 
                      className="mt-6 rounded-full text-xs h-8 border-green-200 text-green-600 hover:bg-green-50 hover:text-green-700"
                    >
                      첫 게시물을 등록해보세요
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-1 p-1">
                  {(notifications || []).slice(0, 30).map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onRead={markAsRead}
                    />
                  ))}
                </div>
              )}
            </div>
            {notifications.length > 5 && (
              <div className="p-3 border-t border-gray-50 bg-gray-50/50 text-center backdrop-blur-sm sticky bottom-0">
                <Link
                  href="/mypage/notifications"
                  className="text-xs font-bold text-gray-400 hover:text-green-600 transition-colors flex items-center justify-center gap-1"
                >
                  모든 알림 보기 <Sparkles className="w-3 h-3" />
                </Link>
              </div>
            )}
          </TabsContent>

          <TabsContent value="settings" className="m-0 focus-visible:outline-none bg-gray-50/30">
            <div className="p-5 space-y-8 max-h-[460px] overflow-y-auto custom-scrollbar">
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-1 h-3 bg-green-500 rounded-full"></span>
                  일반 알림 설정
                </h4>
                
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-5">
                    <div className="flex items-center justify-between group">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                          <Rocket className="w-4 h-4 text-blue-500" /> 신규 프로젝트
                        </Label>
                        <p className="text-[10px] text-gray-400 pl-6">내 관심사 일치 시 수신</p>
                      </div>
                      <Switch 
                        checked={settings.projects}
                        onCheckedChange={(v) => updateSetting('projects', v)}
                        className="data-[state=checked]:bg-green-500"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                          <Briefcase className="w-4 h-4 text-emerald-500" /> 연결하기
                        </Label>
                        <p className="text-[10px] text-gray-400 pl-6">채용/공모전 관심 분야 알림</p>
                      </div>
                      <Switch 
                        checked={settings.recruit}
                        onCheckedChange={(v) => updateSetting('recruit', v)}
                        className="data-[state=checked]:bg-green-500"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                        <Heart className="w-4 h-4 text-red-500" /> 좋아요
                      </Label>
                      <Switch 
                        checked={settings.likes}
                        onCheckedChange={(v) => updateSetting('likes', v)}
                        className="data-[state=checked]:bg-green-500"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                        <MessageCircle className="w-4 h-4 text-orange-500" /> 소통/제안
                      </Label>
                      <Switch 
                        checked={settings.proposals}
                        onCheckedChange={(v) => updateSetting('proposals', v)}
                        className="data-[state=checked]:bg-green-500"
                      />
                    </div>
                </div>
              </div>

              {isAdmin && (
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest flex items-center gap-2">
                     <span className="w-1 h-3 bg-indigo-500 rounded-full"></span>
                     관리자 전용
                  </h4>
                  <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-bold text-gray-700">고객 1:1 문의</Label>
                        <Switch 
                          checked={settings.adminInquiries}
                          onCheckedChange={(v) => updateSetting('adminInquiries', v)}
                          className="data-[state=checked]:bg-indigo-500"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-bold text-gray-700">신규 회원 가입</Label>
                        <Switch 
                          checked={settings.adminSignups}
                          onCheckedChange={(v) => updateSetting('adminSignups', v)}
                          className="data-[state=checked]:bg-indigo-500"
                        />
                      </div>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-gray-200">
                  <Button 
                    variant="outline" 
                    className="w-full border-dashed border-gray-300 text-gray-500 hover:text-green-600 hover:border-green-300 hover:bg-green-50 h-10 text-xs font-bold"
                    onClick={handleTestNotification}
                  >
                    <FlaskConical className="w-3.5 h-3.5 mr-2" />
                    알림 UI 테스트 (Test Notification)
                  </Button>
                  <p className="text-[10px] text-gray-400 text-center mt-2">
                    버튼을 누르면 나에게 테스트 알림을 즉시 발송합니다.
                  </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}
