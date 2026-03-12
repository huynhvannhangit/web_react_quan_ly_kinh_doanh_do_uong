// cspell:disable
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Home,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  Search,
  Coffee,
  CreditCard,
  BarChart3,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSystemConfig } from "@/components/providers/system-config-provider";
import Image from "next/image";
import { getImageUrl } from "@/utils/url";
import { Permission } from "@/types";
import { useAuth } from "@/components/providers/auth-provider";

interface MenuItem {
  title: string;
  href?: string;
  icon: React.ElementType;
  permissions?: Permission[];
  children?: {
    title: string;
    href: string;
    permissions?: Permission[];
  }[];
}

const menuItems: MenuItem[] = [
  {
    title: "Tổng quan",
    href: "/dashboard",
    icon: Home,
    permissions: [Permission.DASHBOARD_VIEW_ALL],
  },
  {
    title: "Quản lý tài khoản",
    icon: Users,
    permissions: [Permission.EMPLOYEE_VIEW_ALL, Permission.USER_VIEW_ALL],
    children: [
      {
        title: "Danh sách nhân viên",
        href: "/nhan-vien",
        permissions: [Permission.EMPLOYEE_VIEW_ALL],
      },
      {
        title: "Danh sách tài khoản",
        href: "/tai-khoan",
        permissions: [Permission.USER_VIEW_ALL],
      },
      {
        title: "Vai trò & Quyền",
        href: "/phan-quyen/vai-tro",
        permissions: [Permission.ROLE_VIEW_ALL],
      },
      {
        title: "Phân quyền người dùng",
        href: "/phan-quyen/nguoi-dung",
        permissions: [Permission.USER_VIEW_ALL],
      },
    ],
  },
  {
    title: "Quản lý cửa hàng",
    icon: Coffee,
    permissions: [
      Permission.AREA_VIEW_ALL,
      Permission.TABLE_VIEW_ALL,
      Permission.PRODUCT_VIEW_ALL,
      Permission.APPROVAL_VIEW_ALL,
      Permission.CATEGORY_VIEW_ALL,
    ],
    children: [
      {
        title: "Khu vực",
        href: "/khu-vuc",
        permissions: [Permission.AREA_VIEW_ALL],
      },
      { title: "Bàn", href: "/ban", permissions: [Permission.TABLE_VIEW_ALL] },
      {
        title: "Danh mục",
        href: "/danh-muc",
        permissions: [Permission.CATEGORY_VIEW_ALL],
      },
      {
        title: "Sản phẩm",
        href: "/san-pham",
        permissions: [Permission.PRODUCT_VIEW_ALL],
      },
      {
        title: "Phê duyệt yêu cầu",
        href: "/phe-duyet",
        permissions: [Permission.APPROVAL_VIEW_ALL],
      },
    ],
  },
  {
    title: "Bán hàng",
    icon: CreditCard,
    permissions: [Permission.ORDER_CREATE, Permission.INVOICE_VIEW_ALL],
    children: [
      {
        title: "Gọi món",
        href: "/goi-mon",
        permissions: [Permission.ORDER_CREATE],
      },
      {
        title: "Danh sách hoá đơn",
        href: "/hoa-don",
        permissions: [Permission.INVOICE_VIEW_ALL],
      },
    ],
  },
  {
    title: "Báo cáo & Thống kê",
    icon: BarChart3,
    permissions: [Permission.STATISTICS_VIEW_ALL],
    children: [
      {
        title: "Doanh thu theo ngày",
        href: "/bao-cao/ngay",
        permissions: [Permission.STATISTICS_VIEW_ALL],
      },
      {
        title: "Thống kê theo tuần",
        href: "/bao-cao/tuan",
        permissions: [Permission.STATISTICS_VIEW_ALL],
      },
      {
        title: "Thống kê theo tháng",
        href: "/bao-cao/thang",
        permissions: [Permission.STATISTICS_VIEW_ALL],
      },
    ],
  },
  {
    title: "Trợ lý AI",
    href: "/chat-ai",
    icon: MessageSquare,
    permissions: [Permission.AI_ASSISTANT_CHAT],
  },
  {
    title: "Quản trị hệ thống",
    icon: Settings,
    permissions: [Permission.SETTING_MANAGE, Permission.LOGGING_VIEW_ALL],
    children: [
      {
        title: "Cấu hình hệ thống",
        href: "/cau-hinh",
        permissions: [Permission.SETTING_MANAGE],
      },
      {
        title: "Nhật ký hệ thống",
        href: "/nhat-ky",
        permissions: [Permission.LOGGING_VIEW_ALL],
      },
    ],
  },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<string[]>(() => {
    // Pre-expand any group whose child matches the current pathname at mount,
    // so menus stay open after F5 (before auth resolves filteredMenuItems)
    return menuItems
      .filter((item) =>
        item.children?.some((child) => pathname.startsWith(child.href)),
      )
      .map((item) => item.title);
  });
  const { config } = useSystemConfig();
  const { user } = useAuth();

  const userPermissions = useMemo(() => {
    return user?.permissions || [];
  }, [user]);

  const hasPermission = useCallback(
    (required?: Permission[]) => {
      if (!required || required.length === 0) return true;
      return required.some((p) => userPermissions.includes(p));
    },
    [userPermissions],
  );

  const filteredMenuItems = useMemo(() => {
    return menuItems
      .filter((item) => hasPermission(item.permissions))
      .map((item) => {
        if (item.children) {
          return {
            ...item,
            children: item.children.filter((child) =>
              hasPermission(child.permissions),
            ),
          };
        }
        return item;
      })
      .filter(
        (item) => !item.children || item.children.length > 0 || item.href,
      );
  }, [hasPermission]);

  const toggleItem = (title: string) => {
    setExpandedItems((prev) =>
      prev.includes(title)
        ? prev.filter((item) => item !== title)
        : [...prev, title],
    );
  };

  const isActive = (href: string) => pathname === href;

  const isParentActive = (children?: { href: string }[]) => {
    return children?.some((child) => pathname.startsWith(child.href));
  };

  useEffect(() => {
    const isChildActive = (children?: { href: string }[]) => {
      return children?.some((child) => pathname.startsWith(child.href));
    };

    filteredMenuItems.forEach((item) => {
      if (item.children && isChildActive(item.children)) {
        setExpandedItems((prev) =>
          prev.includes(item.title) ? prev : [...prev, item.title],
        );
      }
    });
  }, [pathname, filteredMenuItems]);

  return (
    <aside
      className={cn(
        "no-print relative flex h-full flex-col border-r border-border bg-linear-to-br from-[#006ccf] to-[#00509a] text-white transition-all duration-300",
        collapsed ? "w-20" : "w-64",
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-white/10 px-4">
        {!collapsed && (
          <div className="flex items-center gap-2 overflow-hidden">
            {config?.logoUrl ? (
              <Link
                href="/dashboard"
                className="relative h-10 w-10 shrink-0 hover:opacity-80 transition-opacity"
              >
                <Image
                  src={getImageUrl(config.logoUrl)}
                  alt="Logo"
                  fill
                  className="object-contain"
                  unoptimized
                />
              </Link>
            ) : (
              <Link
                href="/dashboard"
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded bg-white text-[#006ccf] font-bold shrink-0 hover:opacity-80 transition-opacity",
                )}
              >
                {config?.systemName
                  ? config.systemName.substring(0, 2).toUpperCase()
                  : "QL"}
              </Link>
            )}
            <span className="text-lg font-semibold whitespace-nowrap">
              {config?.systemName || "QL Đồ Uống"}
            </span>
          </div>
        )}

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="text-white hover:bg-white/10 ml-auto shrink-0"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Search */}
      {!collapsed && (
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/60" />
            <Input
              type="search"
              placeholder="Tìm kiếm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white/10 pl-9 text-white placeholder:text-white/60 border-white/20 focus-visible:ring-white/40"
            />
          </div>
        </div>
      )}

      {/* Navigation */}
      <ScrollArea className="flex-1">
        <nav className="space-y-1 p-4">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon;
            const hasChildren = item.children && item.children.length > 0;
            const isExpanded = expandedItems.includes(item.title);
            const isItemActive = item.href
              ? isActive(item.href)
              : isParentActive(item.children);

            const matchesSearch =
              item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
              item.children?.some((c) =>
                c.title.toLowerCase().includes(searchQuery.toLowerCase()),
              );

            if (searchQuery && !matchesSearch) return null;

            return (
              <div key={item.title}>
                {/* Parent Item */}
                {item.href ? (
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                      isItemActive
                        ? "bg-white/20 text-white"
                        : "text-white/80 hover:bg-white/10 hover:text-white",
                      collapsed && "justify-center",
                    )}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    {!collapsed && <span>{item.title}</span>}
                  </Link>
                ) : (
                  <button
                    onClick={() => hasChildren && toggleItem(item.title)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                      isItemActive
                        ? "bg-white/20 text-white"
                        : "text-white/80 hover:bg-white/10 hover:text-white",
                      collapsed && "justify-center",
                    )}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    {!collapsed && (
                      <>
                        <span className="flex-1 text-left">{item.title}</span>
                        {hasChildren && (
                          <ChevronRight
                            className={cn(
                              "h-4 w-4 transition-transform",
                              isExpanded && "rotate-90",
                            )}
                          />
                        )}
                      </>
                    )}
                  </button>
                )}

                {/* Children Items */}
                {hasChildren && !collapsed && isExpanded && (
                  <div className="ml-6 mt-1 space-y-1 border-l border-white/20 pl-3">
                    {item.children?.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={cn(
                          "block rounded-md px-3 py-2 text-sm transition-colors",
                          isActive(child.href)
                            ? "bg-white/20 text-white font-medium"
                            : "text-white/70 hover:bg-white/10 hover:text-white",
                        )}
                      >
                        {child.title}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Footer */}
      {!collapsed && (
        <div className="border-t border-white/10 p-4">
          <p className="text-xs text-white/60 text-center">
            {config?.footerText || `© ${new Date().getFullYear()} QLDO`}
          </p>
        </div>
      )}
    </aside>
  );
}
