"use client";

import { useState } from "react";
import { Bell, Check, Trash2, Heart, MessageCircle, UserPlus, AtSign, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNotifications, Notification } from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";
import Link from "next/link";

// 알림 타입별 아이콘
const notificationIcons = {
  like: Heart,
  comment: MessageCircle,
  follow: UserPlus,
  mention: AtSign,
  system: Info,
};

// 시간 포맷
function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  if (diff < 60000) return "방금 전";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}분 전`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}시간 전`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}일 전`;

  return date.toLocaleDateString("ko-KR");
}

interface NotificationItemProps {
  notification: Notification;
  onRead: (id: string) => void;
}

function NotificationItem({ notification, onRead }: NotificationItemProps) {
  const Icon = notificationIcons[notification.type] || Info;

  const content = (
    <div
      className={cn(
        "flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors",
        notification.read
          ? "bg-transparent hover:bg-gray-50 dark:hover:bg-gray-800"
          : "bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30"
      )}
      onClick={() => !notification.read && onRead(notification.id)}
    >
      <div
        className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
          notification.type === "like" && "bg-red-100 text-red-500",
          notification.type === "comment" && "bg-blue-100 text-blue-500",
          notification.type === "follow" && "bg-green-100 text-green-500",
          notification.type === "mention" && "bg-purple-100 text-purple-500",
          notification.type === "system" && "bg-gray-100 text-gray-500"
        )}
      >
        <Icon className="w-4 h-4" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
          {notification.title}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
          {notification.message}
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          {formatTime(notification.createdAt)}
        </p>
      </div>

      {!notification.read && (
        <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0 mt-2" />
      )}
    </div>
  );

  if (notification.link) {
    return <Link href={notification.link}>{content}</Link>;
  }

  return content;
}

export function NotificationBell() {
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
  } = useNotifications();
  const [open, setOpen] = useState(false);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative w-9 h-9 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
          aria-label="알림"
        >
          <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-80 max-h-[480px] overflow-y-auto"
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between p-3 border-b">
          <h3 className="font-semibold text-gray-900 dark:text-white">알림</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-gray-500 hover:text-gray-700"
              onClick={markAllAsRead}
            >
              <Check className="w-3 h-3 mr-1" />
              모두 읽음
            </Button>
          )}
        </div>

        {/* 알림 목록 */}
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">
              <div className="animate-spin w-6 h-6 border-2 border-gray-300 border-t-green-500 rounded-full mx-auto" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Bell className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p className="text-sm">알림이 없습니다</p>
            </div>
          ) : (
            notifications.slice(0, 10).map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onRead={markAsRead}
              />
            ))
          )}
        </div>

        {/* 더보기 */}
        {notifications.length > 10 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link
                href="/mypage/notifications"
                className="w-full text-center text-sm text-gray-500 hover:text-green-600"
              >
                모든 알림 보기
              </Link>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
