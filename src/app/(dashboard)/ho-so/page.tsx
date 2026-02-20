// cspell:disable
"use client";

import { useAuth, AuthUser } from "@/components/providers/auth-provider";
import { userService, User } from "@/services/user.service";
import { getAvatarUrl } from "@/utils/url";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  User as UserIcon,
  Mail,
  Shield,
  Briefcase,
  IdCard,
  Loader2,
} from "lucide-react";
import { useEffect, useState } from "react";

export default function HoSoPage() {
  const { user } = useAuth() as { user: AuthUser | null };
  const [userDetail, setUserDetail] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserDetail = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }
      try {
        const data = await userService.getOne(user.id as number);
        setUserDetail(data);
      } catch {
        // fallback: dùng dữ liệu từ auth context
      } finally {
        setIsLoading(false);
      }
    };
    fetchUserDetail();
  }, [user?.id]);

  const displayName =
    userDetail?.fullName ||
    user?.fullName ||
    user?.email?.split("@")[0] ||
    "Người dùng";

  const displayEmail = userDetail?.email || user?.email || "—";

  const roleName = (() => {
    const role = userDetail?.role || user?.role;
    if (!role) return "—";
    if (typeof role === "object" && "name" in role)
      return (role as { name: string }).name;
    return role as string;
  })();

  const avatarInitials = displayName.substring(0, 2).toUpperCase();

  const infoItems = [
    {
      icon: <UserIcon className="h-4 w-4 text-muted-foreground" />,
      label: "Họ và tên",
      value: displayName,
    },
    {
      icon: <Mail className="h-4 w-4 text-muted-foreground" />,
      label: "Email",
      value: displayEmail,
    },
    {
      icon: <Shield className="h-4 w-4 text-muted-foreground" />,
      label: "Vai trò",
      value: roleName,
      isBadge: true,
    },
  ];

  const employeeItems = userDetail?.employee
    ? [
        {
          icon: <UserIcon className="h-4 w-4 text-muted-foreground" />,
          label: "Tên nhân viên",
          value: userDetail.employee.fullName,
        },
        {
          icon: <IdCard className="h-4 w-4 text-muted-foreground" />,
          label: "Mã nhân viên",
          value: userDetail.employee.employeeCode,
        },
      ]
    : null;

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const avatarDisplayUrl = getAvatarUrl(userDetail?.avatar || user?.avatar);

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Hồ sơ của tôi</h1>
        <p className="text-muted-foreground mt-1">
          Thông tin tài khoản và hồ sơ cá nhân
        </p>
      </div>

      {/* Avatar + tên card */}
      <Card className="shadow-sm">
        <CardContent className="pt-8 pb-6">
          <div className="flex flex-col items-center gap-4">
            <Avatar className="h-24 w-24 border-4 border-primary/20 shadow-md">
              <AvatarImage
                src={avatarDisplayUrl}
                alt={displayName}
                className="object-cover"
              />
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                {avatarInitials}
              </AvatarFallback>
            </Avatar>
            <div className="text-center">
              <h2 className="text-xl font-semibold">{displayName}</h2>
              <p className="text-sm text-muted-foreground">{displayEmail}</p>
              <Badge variant="secondary" className="mt-2">
                {roleName}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Thông tin tài khoản */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <UserIcon className="h-4 w-4" />
            Thông tin tài khoản
          </CardTitle>
          <CardDescription>Chi tiết hồ sơ tài khoản của bạn</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {infoItems.map((item, idx) => (
              <div key={idx}>
                <div className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    {item.icon}
                    <span className="text-sm text-muted-foreground">
                      {item.label}
                    </span>
                  </div>
                  {item.isBadge ? (
                    <Badge variant="outline">{item.value}</Badge>
                  ) : (
                    <span className="text-sm font-medium">{item.value}</span>
                  )}
                </div>
                {idx < infoItems.length - 1 && <hr className="border-border" />}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Thông tin nhân viên liên kết */}
      {employeeItems && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Briefcase className="h-4 w-4" />
              Thông tin nhân viên
            </CardTitle>
            <CardDescription>
              Nhân viên được liên kết với tài khoản này
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {employeeItems.map((item, idx) => (
                <div key={idx}>
                  <div className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      {item.icon}
                      <span className="text-sm text-muted-foreground">
                        {item.label}
                      </span>
                    </div>
                    <span className="text-sm font-medium">{item.value}</span>
                  </div>
                  {idx < employeeItems.length - 1 && (
                    <hr className="border-border" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Trường hợp không có nhân viên liên kết */}
      {!employeeItems && userDetail && (
        <Card className="shadow-sm border-dashed">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-2 text-center text-muted-foreground py-4">
              <Briefcase className="h-8 w-8 opacity-40" />
              <p className="text-sm">
                Tài khoản này chưa được liên kết với nhân viên nào
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
