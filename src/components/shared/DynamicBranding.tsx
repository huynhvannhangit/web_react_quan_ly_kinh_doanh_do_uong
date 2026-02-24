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
          "/khach-hang": "Khách hàng",
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
        if (pageTitle) {
          document.title = `${config.systemName} - ${pageTitle}`;
        } else {
          document.title = config.systemName;
        }
      }

      // Update Favicon
      if (config.logoUrl) {
        const fullLogoUrl = getImageUrl(config.logoUrl);

        let link = document.querySelector(
          "link[rel*='icon']",
        ) as HTMLLinkElement;

        if (!link) {
          link = document.createElement("link");
          link.rel = "icon";
          document.getElementsByTagName("head")[0].appendChild(link);
        }

        link.href = fullLogoUrl;
      }
    }
  }, [config, pathname]);

  return null;
}
