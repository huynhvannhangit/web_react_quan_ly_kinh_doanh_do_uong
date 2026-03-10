"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/components/providers/auth-provider";
import { useSystemConfig } from "@/components/providers/system-config-provider";
import { ShieldAlert, LogOut, Clock } from "lucide-react";
import Image from "next/image";
import { getImageUrl } from "@/utils/url";

export default function WaitingApprovalPage() {
  const { logout, user } = useAuth();
  const { config } = useSystemConfig();

  return (
    <div className="flex h-screen w-full items-center justify-center px-4 bg-muted/40 font-montserrat">
      <Card className="w-full max-w-md shadow-lg border-2 border-amber-500/20">
        <CardHeader className="space-y-1 text-center border-b pb-6">
          <div className="flex justify-center mb-4">
            {config?.logoUrl ? (
              <div className="relative h-12 w-12 shrink-0">
                <Image
                  src={getImageUrl(config.logoUrl)}
                  alt="Logo"
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-xl">
                {config?.systemName
                  ? config.systemName.substring(0, 2).toUpperCase()
                  : "QL"}
              </div>
            )}
          </div>
          <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2 text-amber-600">
            <Clock className="h-6 w-6" />
            Đang chờ phê duyệt
          </CardTitle>
          <CardDescription className="text-base">
            Tài khoản:{" "}
            <span className="font-semibold text-foreground">{user?.email}</span>
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-6 text-center space-y-4">
          <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-lg border border-amber-100 dark:border-amber-900/30">
            <p className="text-amber-800 dark:text-amber-300 text-sm leading-relaxed">
              Tài khoản của bạn đã được đăng ký thành công nhưng chưa được phân
              quyền truy cập. Vui lòng quay lại sau hoặc liên hệ với quản trị
              viên hệ thống để được hỗ trợ.
            </p>
          </div>

          <div className="flex items-start gap-3 p-3 text-xs text-muted-foreground bg-slate-50 dark:bg-slate-900/50 rounded border border-slate-100 dark:border-slate-800 text-left">
            <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5 text-amber-500" />
            <p>
              Bạn không có quyền truy cập vào bảng điều khiển (Dashboard) và các
              chức năng quản lý khác khi chưa được cấp vai trò.
            </p>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-4 border-t pt-6">
          <Button
            variant="outline"
            className="w-full border-primary/20 hover:bg-primary/5"
            onClick={() => window.location.reload()}
          >
            Kiểm tra lại trạng thái
          </Button>

          <Button
            variant="ghost"
            className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={logout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Đăng xuất
          </Button>

          <div className="text-center text-[10px] text-muted-foreground uppercase tracking-wider">
            {config?.systemName || "Quản lý Kinh doanh Đồ Uống"}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
