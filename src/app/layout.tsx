import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { AuthProvider } from "@/components/providers/auth-provider";
import { SystemConfigProvider } from "@/components/providers/system-config-provider";
import { DynamicBranding } from "@/components/shared/DynamicBranding";
import { Toaster } from "sonner";

const montserrat = Montserrat({
  subsets: ["latin", "vietnamese"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-montserrat",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Quản lý Kinh doanh Đồ Uống",
    template: "%s | Quản lý Kinh doanh Đồ Uống",
  },
  description: "Hệ thống quản lý kinh doanh đồ uống",
  keywords: ["quản lý", "kinh doanh", "đồ uống"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={`${montserrat.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <SystemConfigProvider>
            <DynamicBranding />
            <AuthProvider>{children}</AuthProvider>
          </SystemConfigProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
