"use client";

import { useState, useEffect, useRef } from "react";
import { useSystemConfig } from "@/components/providers/system-config-provider";
import { systemConfigService } from "@/services/system-config.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Save, Upload } from "lucide-react";
import Image from "next/image";
import { getImageUrl } from "@/utils/url";
import { Permission } from "@/types";
import { PermissionGuard } from "@/components/shared/PermissionGuard";
import { ImageEditorDialog } from "@/components/shared/ImageEditorDialog";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

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

  const [imageEditorOpen, setImageEditorOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [rawImageSrc, setRawImageSrc] = useState<string | null>(null);

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

    const reader = new FileReader();
    reader.onloadend = () => {
      setRawImageSrc(reader.result as string);
      setImageEditorOpen(true);
    };
    reader.readAsDataURL(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleImageEditConfirm = async (blob: Blob) => {
    setImageEditorOpen(false);
    const file = new File([blob], "logo.png", { type: "image/png" });

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
      setRawImageSrc(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload: Parameters<typeof systemConfigService.update>[0] = {
        systemName: formData.systemName.trim(),
        logoUrl: formData.logoUrl,
        email: formData.email.trim() || "",
        phone: formData.phone.trim() || "",
        address: formData.address.trim() || "",
        footerText: formData.footerText.trim() || "",
      };

      await systemConfigService.update(payload);
      await refreshConfig();
      toast.success("Cập nhật cấu hình thành công.");
    } catch (error: unknown) {
      console.error("Update system config failed:", error);
      const msg =
        (error as { customMessage?: string }).customMessage ||
        (error instanceof Error
          ? error.message
          : "Có lỗi xảy ra khi cập nhật cấu hình.");
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PermissionGuard
      permissions={[Permission.SETTING_MANAGE]}
      redirect="/dashboard"
    >
      <Card>
        <CardContent className="p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-wide text-[#00509E] dark:text-blue-400 uppercase">
                Cấu hình hệ thống
              </h1>
              <p className="text-muted-foreground">
                Quản lý thông tin cơ bản, logo và các thiết lập chung của hệ
                thống.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid gap-6">
              <div className="space-y-6">
                <div className="pb-4">
                  <h3 className="text-lg font-semibold">Thông tin nhận diện</h3>
                  <p className="text-sm text-muted-foreground">
                    Tên hệ thống và hình ảnh đại diện (logo).
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="systemName">
                      Tên hệ thống <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="systemName"
                      name="systemName"
                      value={formData.systemName}
                      onChange={handleChange}
                      placeholder="Ví dụ: QL Đồ Uống"
                      required
                      onInvalid={(e) =>
                        (e.target as HTMLInputElement).setCustomValidity(
                          "Vui lòng điền vào trường này",
                        )
                      }
                      onInput={(e) =>
                        (e.target as HTMLInputElement).setCustomValidity("")
                      }
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-6">
                    <div
                      className="relative group cursor-pointer"
                      onClick={() => setDetailDialogOpen(true)}
                    >
                      <div className="h-40 w-40 rounded-2xl border-2 border-dashed border-muted-foreground/20 bg-muted/30 flex items-center justify-center overflow-hidden transition-all hover:border-primary/50 hover:bg-muted/50">
                        {formData.logoUrl ? (
                          <Image
                            src={getImageUrl(formData.logoUrl)}
                            alt="Logo"
                            fill
                            className="object-contain p-2"
                            unoptimized
                          />
                        ) : (
                          <div className="text-muted-foreground text-center p-4">
                            <Upload className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p className="text-xs">Chưa có logo</p>
                          </div>
                        )}
                      </div>
                      {formData.logoUrl && (
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-2xl">
                          <p className="text-white text-xs font-medium">
                            Xem chi tiết
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4 flex-1">
                      <div className="space-y-2">
                        <Label>Logo Hệ Thống</Label>
                        <p className="text-xs text-muted-foreground">
                          Logo sẽ hiển thị trên thanh điều hướng, trang đăng
                          nhập và hóa đơn.
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
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
                          className="rounded-full px-6"
                        >
                          {isUploading ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <Upload className="h-4 w-4 mr-2" />
                          )}
                          Tải lên logo mới
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6 pt-6">
                <div>
                  <h3 className="text-lg font-semibold">Thông tin liên hệ</h3>
                  <p className="text-sm text-muted-foreground">
                    Email, số điện thoại và địa chỉ hiển thị trên hóa đơn hoặc
                    footer.
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                </div>
              </div>

              <div className="space-y-6 pt-6">
                <div>
                  <h3 className="text-lg font-semibold">Thiết lập khác</h3>
                  <p className="text-sm text-muted-foreground">
                    Văn bản chân trang (Footer) và các thông tin bổ sung.
                  </p>
                </div>
                <div className="space-y-4">
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
                </div>

                <div className="flex justify-end pt-6">
                  <Button type="submit" size="lg" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Đang lưu...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        <span>Lưu cấu hình</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      <ImageEditorDialog
        open={imageEditorOpen}
        imageSrc={rawImageSrc || ""}
        onClose={() => {
          setImageEditorOpen(false);
          setRawImageSrc(null);
        }}
        onConfirm={handleImageEditConfirm}
      />

      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-[80vw] w-auto h-auto border-none bg-transparent shadow-none p-0 outline-none flex items-center justify-center [&>button]:hidden">
          <DialogTitle className="sr-only">Chi tiết Logo</DialogTitle>
          <div className="relative group p-2">
            <button
              onClick={() => setDetailDialogOpen(false)}
              className="absolute top-0 right-0 z-50 flex h-8 w-8 -translate-y-1/2 translate-x-1/2 items-center justify-center rounded-full bg-white text-slate-500 shadow-md border hover:bg-slate-100 hover:text-slate-900 transition-colors focus:outline-none"
              title="Đóng (Esc)"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
            <div
              className="relative w-full max-h-[85vh] cursor-zoom-out flex items-center justify-center bg-transparent"
              onClick={() => setDetailDialogOpen(false)}
            >
              {formData.logoUrl && (
                <Image
                  src={getImageUrl(formData.logoUrl)}
                  alt="Logo Detail"
                  className="max-w-2xl max-h-[70vh] w-auto h-auto object-contain rounded-xl drop-shadow-[0_0_15px_rgba(255,255,255,0.5)] transition-all duration-300"
                  width={800}
                  height={800}
                  unoptimized
                />
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </PermissionGuard>
  );
}
