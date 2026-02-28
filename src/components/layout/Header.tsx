// cspell:disable
"use client";

import {
  Bell,
  Moon,
  Sun,
  User,
  LogOut,
  Settings,
  ChevronDown,
} from "lucide-react";
import { getAvatarUrl } from "@/utils/url";
import { useTheme } from "next-themes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuArrow,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useAuth, AuthUser } from "@/components/providers/auth-provider";
import { useNotificationContext } from "@/components/providers/notification-provider";

const formatTime = (dateStr: string) => {
  const d = new Date(dateStr);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - d.getTime()) / 60000);
  if (diffInMinutes < 1) return "Vừa xong";
  if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} giờ trước`;
  return d.toLocaleDateString("vi-VN");
};

export function Header() {
  const { theme, setTheme } = useTheme();
  const { user } = useAuth() as { user: AuthUser | null };
  const { notifications, unreadCount, markAsRead, markAllAsRead } =
    useNotificationContext();

  return (
    <header className="no-print sticky top-0 z-50 flex h-16 items-center justify-between bg-background px-6 shadow-sm">
      <div className="flex-1"></div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="h-9 w-9"
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative h-9 w-9">
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -right-1 -top-1 h-4 w-4 rounded-full p-0 text-[10px] flex items-center justify-center"
                >
                  {unreadCount > 9 ? "9+" : unreadCount}
                </Badge>
              )}
              <span className="sr-only">Notifications</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <div className="flex items-center justify-between px-2 pt-1">
              <DropdownMenuLabel>Thông báo</DropdownMenuLabel>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  className="h-auto p-1 text-[11px] text-primary hover:bg-transparent"
                  onClick={(e) => {
                    e.preventDefault();
                    markAllAsRead();
                  }}
                >
                  Đã đọc tất cả
                </Button>
              )}
            </div>
            <DropdownMenuSeparator />
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  Không có thông báo mới
                </div>
              ) : (
                notifications.map((notif, index) => (
                  <DropdownMenuItem
                    key={notif.id || `notif-${index}`}
                    className={`flex-col items-start py-3 cursor-pointer ${
                      notif.read ? "opacity-70" : "bg-muted/30 font-medium"
                    }`}
                    onClick={() => {
                      if (!notif.read && notif.id) markAsRead(notif.id);
                    }}
                  >
                    <div className="text-sm font-semibold">{notif.title}</div>
                    <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {notif.message}
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-1.5 font-medium">
                      {formatTime(notif.createdAt)}
                    </div>
                  </DropdownMenuItem>
                ))
              )}
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="justify-center text-primary cursor-pointer font-medium"
              disabled
            >
              Xem tất cả thông báo
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-2 h-9 px-2 ml-2 hover:bg-muted/50"
            >
              <Avatar className="h-10 w-10 border border-border">
                <AvatarImage
                  src={getAvatarUrl(user?.avatar)}
                  alt="User"
                  className="object-cover"
                />
                <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                  {user?.fullName
                    ? user.fullName.substring(0, 2).toUpperCase()
                    : user?.email
                      ? user.email.substring(0, 2).toUpperCase()
                      : "AD"}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:block text-left">
                <div className="text-sm font-medium leading-none">
                  {user?.fullName || user?.email?.split("@")[0] || "User"}
                </div>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-56 p-2 rounded-xl"
            sideOffset={12}
          >
            <DropdownMenuArrow className="fill-popover" />
            <DropdownMenuItem
              className="cursor-pointer py-3 rounded-lg hover:bg-muted"
              asChild
            >
              <Link href="/ho-so" className="flex items-center w-full">
                <User className="mr-3 h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Hồ sơ cá nhân</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer py-3 rounded-lg hover:bg-muted"
              asChild
            >
              <Link href="/cai-dat" className="flex items-center w-full">
                <Settings className="mr-3 h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Cài đặt</span>
              </Link>
            </DropdownMenuItem>

            <DropdownMenuSeparator className="my-2" />

            <DropdownMenuItem
              className="text-destructive focus:text-destructive cursor-pointer py-3 rounded-lg hover:bg-destructive/10"
              asChild
            >
              <Link href="/login" className="flex items-center w-full">
                <LogOut className="mr-3 h-4 w-4" />
                <span className="font-medium">Đăng xuất</span>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
