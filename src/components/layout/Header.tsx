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

export function Header() {
  const { theme, setTheme } = useTheme();
  const { user } = useAuth() as { user: AuthUser | null };

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
              <Badge
                variant="destructive"
                className="absolute -right-1 -top-1 h-4 w-4 rounded-full p-0 text-[10px] flex items-center justify-center"
              >
                3
              </Badge>
              <span className="sr-only">Notifications</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Thông báo</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="max-h-96 overflow-y-auto">
              <DropdownMenuItem className="flex-col items-start py-3 cursor-pointer">
                <div className="font-medium">Đơn hàng mới #1234</div>
                <div className="text-xs text-muted-foreground">
                  5 phút trước
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex-col items-start py-3 cursor-pointer">
                <div className="font-medium">
                  Cảnh báo tồn kho thấp: Café hạt
                </div>
                <div className="text-xs text-muted-foreground">1 giờ trước</div>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex-col items-start py-3 cursor-pointer">
                <div className="font-medium">
                  Báo cáo doanh thu ngày đã sẵn sàng
                </div>
                <div className="text-xs text-muted-foreground">2 giờ trước</div>
              </DropdownMenuItem>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="justify-center text-primary cursor-pointer">
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
