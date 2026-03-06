"use client";

import { useEffect } from "react";
import { useSystemConfig } from "@/components/providers/system-config-provider";
import { usePathname } from "next/navigation";
import { getImageUrl } from "@/utils/url";

export function DynamicBranding() {
  const { config } = useSystemConfig();
  const pathname = usePathname();

  useEffect(() => {
    if (config) {
      // Update Title
      if (config.systemName) {
        const routeToTitle: Record<string, string> = {
          "/login": "Đăng nhập",
          "/register": "Đăng ký",
          "/dashboard": "Tổng quan",
          "/cau-hinh": "Cấu hình hệ thống",
          "/nhan-vien": "Nhân viên",
          "/phan-quyen": "Phân quyền",
          "/khu-vuc": "Khu vực",
          "/ban": "Bàn",
          "/danh-muc": "Danh mục",
          "/san-pham": "Sản phẩm",
          "/goi-mon": "Gọi món",
          "/hoa-don": "Hóa đơn",
          "/phe-duyet": "Phê duyệt yêu cầu",
          "/chat-ai": "Trợ lý AI",
        };

        const pageTitle = routeToTitle[pathname];
        const newTitle = pageTitle
          ? `${config.systemName} - ${pageTitle}`
          : config.systemName;

        // Use setTimeout to ensure this runs after Next.js applies its own metadata changes
        setTimeout(() => {
          document.title = newTitle;

          // Update Favicon
          if (config.logoUrl) {
            const fullLogoUrl = getImageUrl(config.logoUrl);

            // Avoid removing DOM nodes directly as it conflicts with React's virtual DOM
            const links = document.querySelectorAll("link[rel*='icon']");
            if (links.length > 0) {
              links.forEach((link) => {
                (link as HTMLLinkElement).href = fullLogoUrl;
              });
            } else {
              const newLink = document.createElement("link");
              newLink.rel = "icon";
              newLink.href = fullLogoUrl;
              document.head.appendChild(newLink);
            }
          }
        }, 50);
      }
    }
  }, [config, pathname]);

  return null;
}
