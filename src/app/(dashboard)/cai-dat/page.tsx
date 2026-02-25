// cspell:disable
"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth, AuthUser } from "@/components/providers/auth-provider";
import { authService } from "@/services/auth.service";
import { userService, User, UpdateUserDto } from "@/services/user.service";
import { getAvatarUrl } from "@/utils/url";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Upload, Save, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import { ImageEditorDialog } from "@/components/shared/ImageEditorDialog";

export default function CaiDatPage() {
  const { user, refreshUser } = useAuth() as {
    user: AuthUser | null;
    refreshUser: () => void;
  };
  const [userDetail, setUserDetail] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [fullName, setFullName] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);

  // Editor states
  const [imageEditorOpen, setImageEditorOpen] = useState(false);
  const [rawImageSrc, setRawImageSrc] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserDetail = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }
      try {
        const data = await userService.getOne(user.id as number);
        setUserDetail(data);
        setFullName(data.fullName || "");
        setAvatar(data.avatar || null);
      } catch (error) {
        console.error("Failed to fetch user details:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUserDetail();
  }, [user?.id]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn file hình ảnh (JPG, PNG, ...)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Kích thước ảnh không được vượt quá 5MB");
      return;
    }

    // Đọc file ra base64 để truyền vào Cropper
    const reader = new FileReader();
    reader.onloadend = () => {
      setRawImageSrc(reader.result as string);
      setImageEditorOpen(true);
    };
    reader.readAsDataURL(file);

    // Reset file input ngay lập tức để nếu user chọn lại file y hệt vẫn fire onChange
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleImageEditConfirm = async (blob: Blob) => {
    setImageEditorOpen(false);
    if (!user?.id) return;

    const file = new File([blob], "avatar.jpg", { type: "image/jpeg" });

    try {
      setIsUploading(true);
      const updatedUser = await userService.uploadAvatar(
        user.id as number,
        file,
      );
      setAvatar(updatedUser.avatar || null);

      // Update persistent storage
      authService.updateUserPayload({ avatar: updatedUser.avatar || null });

      // Refresh Auth Context to reflect in Header immediately
      refreshUser();

      toast.success("Đã cập nhật ảnh đại diện");
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(
        err.response?.data?.message || "Không thể tải lên ảnh đại diện",
      );
    } finally {
      setIsUploading(false);
      setRawImageSrc(null);
    }
  };

  const handleSaveInfo = async () => {
    if (!user?.id || !fullName.trim()) {
      toast.error("Họ và tên không được để trống");
      return;
    }

    try {
      setIsSaving(true);
      // NOTE: Here we need to update fullName but update API only receives DTO logic
      // In the backend, the UpdateUserDto uses PartialType of CreateUserDto
      // Which means we CAN pass fullName in the body of patch request.
      await userService.update(
        user.id as number,
        {
          fullName: fullName.trim(),
        } as UpdateUserDto,
      );

      // Update persistent storage
      authService.updateUserPayload({ fullName: fullName.trim() });

      // Refresh Auth Context to reflect in Header immediately
      refreshUser();

      toast.success("Đã cập nhật thông tin cá nhân");
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(
        err.response?.data?.message || "Không thể cập nhật thông tin",
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const avatarDisplayUrl = getAvatarUrl(avatar);
  const avatarInitials = (fullName || "AD").substring(0, 2).toUpperCase();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Cài đặt</h1>
        <p className="text-muted-foreground mt-1">
          Cập nhật thông tin tài khoản của bạn
        </p>
      </div>

      <div className="grid gap-6">
        {/* Avatar Card */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Ảnh đại diện</CardTitle>
            <CardDescription>
              Nhấn vào ảnh để thay đổi ảnh đại diện
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div
                className="relative cursor-pointer group rounded-full"
                onClick={handleAvatarClick}
              >
                <Avatar className="h-24 w-24 border-4 border-muted transition-all duration-200 group-hover:border-primary/50 group-hover:opacity-80">
                  <AvatarImage src={avatarDisplayUrl} alt={fullName} />
                  <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                    {avatarInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                  {isUploading ? (
                    <Loader2 className="h-6 w-6 text-white animate-spin" />
                  ) : (
                    <Upload className="h-6 w-6 text-white" />
                  )}
                </div>
              </div>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>Định dạng hỗ trợ: JPG, PNG, GIF</p>
                <p>Kích thước tối đa: 5MB</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={handleAvatarClick}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Đang tải lên...
                    </>
                  ) : (
                    <>Tải ảnh mới</>
                  )}
                </Button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/png, image/jpeg, image/gif"
                  className="hidden"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Thông tin cá nhân</CardTitle>
            <CardDescription>
              Cập nhật thông tin định danh của bạn
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-muted-foreground">
                Email / Tài khoản đăng nhập (Không thể thay đổi)
              </Label>
              <Input
                id="email"
                type="email"
                value={user?.email || ""}
                disabled
                className="bg-muted/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fullName">Họ và tên</Label>
              <div className="relative">
                <Input
                  id="fullName"
                  placeholder="Nhập họ và tên"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="pl-10"
                />
                <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-2 border-t pt-4">
            <Button
              variant="default"
              onClick={handleSaveInfo}
              disabled={isSaving || fullName === userDetail?.fullName}
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Lưu thay đổi
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>

      <ImageEditorDialog
        open={imageEditorOpen}
        imageSrc={rawImageSrc || ""}
        onClose={() => {
          setImageEditorOpen(false);
          setRawImageSrc(null);
        }}
        onConfirm={handleImageEditConfirm}
      />
    </div>
  );
}
