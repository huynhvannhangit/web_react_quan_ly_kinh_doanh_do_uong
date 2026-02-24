"use client";

import { useState, useEffect } from "react";
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

const menuItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: Home,
  },
  {
    title: "Quản lý tài khoản",
    icon: Users,
    children: [
      { title: "Danh sách nhân viên", href: "/nhan-vien" },
      { title: "Khách hàng", href: "/khach-hang" },
      { title: "Phân quyền", href: "/phan-quyen" },
    ],
  },
  {
    title: "Quản lý cửa hàng",
    icon: Coffee,
    children: [
      { title: "Khu vực", href: "/khu-vuc" },
      { title: "Bàn", href: "/ban" },
      { title: "Danh mục", href: "/danh-muc" },
      { title: "Sản phẩm", href: "/san-pham" },
    ],
  },
  {
    title: "Bán hàng",
    icon: CreditCard,
    children: [
      { title: "Gọi món", href: "/goi-mon" },
      { title: "Danh sách hoá đơn", href: "/hoa-don" },
    ],
  },
  {
    title: "Báo cáo & Thống kê",
    icon: BarChart3,
    children: [
      { title: "Doanh thu theo ngày", href: "/bao-cao/ngay" },
      { title: "Thống kê theo tuần", href: "/bao-cao/tuan" },
      { title: "Thống kê theo tháng", href: "/bao-cao/thang" },
    ],
  },
  {
    title: "Trợ lý AI",
    href: "/chat-ai",
    icon: MessageSquare,
  },
  {
    title: "Cấu hình hệ thống",
    href: "/cau-hinh",
    icon: Settings,
  },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const pathname = usePathname();
  const { config } = useSystemConfig();

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

    menuItems.forEach((item) => {
      if (item.children && isChildActive(item.children)) {
        setExpandedItems((prev) =>
          prev.includes(item.title) ? prev : [...prev, item.title],
        );
      }
    });
  }, [pathname]);

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
              <div className="relative h-8 w-8 shrink-0">
                <Image
                  src={getImageUrl(config.logoUrl)}
                  alt="Logo"
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>
            ) : null}
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded bg-white text-[#006ccf] font-bold shrink-0",
                config?.logoUrl && "hidden",
              )}
            >
              {config?.systemName
                ? config.systemName.substring(0, 2).toUpperCase()
                : "QL"}
            </div>
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
          {menuItems.map((item) => {
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
