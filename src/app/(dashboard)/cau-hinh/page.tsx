"use client";

import { useState, useEffect, useRef } from "react";
import { useSystemConfig } from "@/components/providers/system-config-provider";
import { systemConfigService } from "@/services/system-config.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Save, Upload } from "lucide-react";
import Image from "next/image";
import { getImageUrl } from "@/utils/url";

// cspell:disable-line
export default function SystemConfigPage() {
  const { config, refreshConfig } = useSystemConfig();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    systemName: "",
    logoUrl: "",
    email: "",
    phone: "",
    address: "",
    footerText: "",
  });

  useEffect(() => {
    if (config) {
      setFormData({
        systemName: config.systemName || "",
        logoUrl: config.logoUrl || "",
        email: config.email || "",
        phone: config.phone || "",
        address: config.address || "",
        footerText: config.footerText || "",
      });
    }
  }, [config]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File quá lớn. Vui lòng chọn file dưới 5MB.");
      return;
    }

    setIsUploading(true);
    try {
      const updatedConfig = await systemConfigService.uploadLogo(file);
      setFormData((prev) => ({
        ...prev,
        logoUrl: updatedConfig.logoUrl || "",
      }));
      await refreshConfig();
      toast.success("Tải logo lên thành công.");
    } catch (error: unknown) {
      console.error("Upload logo failed:", error);
      toast.error("Không thể tải logo lên. Vui lòng thử lại.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await systemConfigService.update(formData);
      await refreshConfig();
      toast.success("Cập nhật cấu hình thành công.");
    } catch (error: unknown) {
      console.error("Update system config failed:", error);
      toast.error("Có lỗi xảy ra khi cập nhật cấu hình.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container max-w-4xl py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Cấu hình hệ thống
          </h1>
          <p className="text-muted-foreground">
            Quản lý thông tin cơ bản, logo và các thiết lập chung của hệ thống.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin nhận diện</CardTitle>
              <CardDescription>
                Tên hệ thống và hình ảnh đại diện (logo).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="systemName">Tên hệ thống</Label>
                <Input
                  id="systemName"
                  name="systemName"
                  value={formData.systemName}
                  onChange={handleChange}
                  placeholder="Ví dụ: QL Đồ Uống"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="logoUrl">URL Logo</Label>
                <div className="flex gap-2">
                  <Input
                    id="logoUrl"
                    name="logoUrl"
                    value={formData.logoUrl}
                    onChange={handleChange}
                    placeholder="https://example.com/logo.png"
                  />
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="shrink-0"
                  >
                    {isUploading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Upload className="h-4 w-4 mr-2" />
                    )}
                    Tải lên
                  </Button>
                </div>
              </div>

              {formData.logoUrl && (
                <div className="mt-2 flex items-center gap-4">
                  <p className="text-sm text-muted-foreground">Xem trước:</p>
                  <div className="relative h-12 w-12 rounded border bg-muted flex items-center justify-center overflow-hidden">
                    <Image
                      src={getImageUrl(formData.logoUrl)}
                      alt="Logo Preview"
                      fill
                      className="object-contain"
                      unoptimized
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Thông tin liên hệ</CardTitle>
              <CardDescription>
                Email, số điện thoại và địa chỉ hiển thị trên hóa đơn hoặc
                footer.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="contact@example.com"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">Số điện thoại</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="0123456789"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="address">Địa chỉ</Label>
                <Input
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Số 1, Đường ABC, Quận XYZ..."
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Thiết lập khác</CardTitle>
              <CardDescription>
                Văn bản chân trang (Footer) và các thông tin bổ sung.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="footerText">Văn bản chân trang</Label>
                <textarea
                  id="footerText"
                  name="footerText"
                  rows={3}
                  className="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={formData.footerText}
                  onChange={handleChange}
                  placeholder="© 2026 QL Đồ Uống. All rights reserved."
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-end border-t px-6 py-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    <span className="ml-2">Lưu cấu hình</span>
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </form>
    </div>
  );
}
