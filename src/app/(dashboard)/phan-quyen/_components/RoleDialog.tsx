"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Role, roleService } from "@/services/role.service";
import { Permission } from "@/types";
import { toast } from "sonner";
import {
  collectErrors,
  required,
  maxLength,
  noHtml,
  inputErrorClass,
} from "@/lib/validators";

interface RoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role?: Role;
  onSuccess: () => void;
}

// Group permissions by module for better UI
const PERMISSION_GROUPS = {
  USER: [
    Permission.USER_VIEW,
    Permission.USER_CREATE,
    Permission.USER_UPDATE,
    Permission.USER_DELETE,
    Permission.USER_SEARCH,
    Permission.USER_APPROVE,
    Permission.USER_MANAGE,
  ],
  PRODUCT: [
    Permission.PRODUCT_VIEW,
    Permission.PRODUCT_CREATE,
    Permission.PRODUCT_UPDATE,
    Permission.PRODUCT_DELETE,
    Permission.PRODUCT_SEARCH,
    Permission.PRODUCT_APPROVE,
  ],
  CATEGORY: [
    Permission.CATEGORY_VIEW,
    Permission.CATEGORY_CREATE,
    Permission.CATEGORY_UPDATE,
    Permission.CATEGORY_DELETE,
    Permission.CATEGORY_SEARCH,
    Permission.CATEGORY_APPROVE,
  ],
  ORDER: [
    Permission.ORDER_VIEW,
    Permission.ORDER_CREATE,
    Permission.ORDER_UPDATE,
    Permission.ORDER_DELETE,
    Permission.ORDER_SEARCH,
    Permission.ORDER_APPROVE,
    Permission.ORDER_CANCEL,
  ],
  INVOICE: [
    Permission.INVOICE_VIEW,
    Permission.INVOICE_CREATE,
    Permission.INVOICE_SEARCH,
    Permission.INVOICE_APPROVE,
    Permission.INVOICE_PAY,
    Permission.INVOICE_CANCEL,
  ],
  EMPLOYEE: [
    Permission.EMPLOYEE_VIEW,
    Permission.EMPLOYEE_CREATE,
    Permission.EMPLOYEE_UPDATE,
    Permission.EMPLOYEE_DELETE,
    Permission.EMPLOYEE_SEARCH,
    Permission.EMPLOYEE_APPROVE,
  ],
  AREA: [
    Permission.AREA_VIEW,
    Permission.AREA_CREATE,
    Permission.AREA_UPDATE,
    Permission.AREA_DELETE,
    Permission.AREA_SEARCH,
    Permission.AREA_APPROVE,
  ],
  TABLE: [
    Permission.TABLE_VIEW,
    Permission.TABLE_CREATE,
    Permission.TABLE_UPDATE,
    Permission.TABLE_DELETE,
    Permission.TABLE_SEARCH,
    Permission.TABLE_APPROVE,
  ],
  APPROVAL: [
    Permission.APPROVAL_VIEW,
    Permission.APPROVAL_CREATE,
    Permission.APPROVAL_UPDATE,
    Permission.APPROVAL_DELETE,
    Permission.APPROVAL_SEARCH,
    Permission.APPROVAL_APPROVE,
    Permission.APPROVAL_MANAGE,
  ],
  ROLE: [
    Permission.ROLE_VIEW,
    Permission.ROLE_CREATE,
    Permission.ROLE_UPDATE,
    Permission.ROLE_DELETE,
    Permission.ROLE_SEARCH,
    Permission.ROLE_APPROVE,
  ],
  STATISTICS: [
    Permission.STATISTICS_VIEW,
    Permission.STATISTICS_EXPORT,
    Permission.STATISTICS_SEARCH,
    Permission.STATISTICS_APPROVE,
  ],
  AI_ASSISTANT: [
    Permission.AI_ASSISTANT_CHAT,
    Permission.AI_ASSISTANT_MANAGE,
    Permission.AI_ASSISTANT_SEARCH,
    Permission.AI_ASSISTANT_APPROVE,
  ],
  NOTIFICATION: [
    Permission.NOTIFICATION_VIEW,
    Permission.NOTIFICATION_CREATE,
    Permission.NOTIFICATION_UPDATE,
    Permission.NOTIFICATION_DELETE,
    Permission.NOTIFICATION_SEARCH,
    Permission.NOTIFICATION_APPROVE,
  ],
  SYSTEM: [
    Permission.SETTING_MANAGE,
    Permission.LOG_VIEW,
    Permission.LOG_DELETE,
    Permission.LOGGING_VIEW,
    Permission.LOGGING_DELETE,
  ],
  DASHBOARD: [Permission.DASHBOARD_VIEW],
};

const GROUP_LABELS: Record<string, string> = {
  USER: "NGƯỜI DÙNG",
  PRODUCT: "SẢN PHẨM",
  CATEGORY: "DANH MỤC",
  ORDER: "ĐƠN HÀNG",
  INVOICE: "HÓA ĐƠN",
  EMPLOYEE: "NHÂN VIÊN",
  AREA: "KHU VỰC",
  TABLE: "BÀN",
  APPROVAL: "PHÊ DUYỆT",
  ROLE: "VAI TRÒ",
  STATISTICS: "THỐNG KÊ",
  AI_ASSISTANT: "TRỢ LÝ AI",
  NOTIFICATION: "THÔNG BÁO",
  SYSTEM: "HỆ THỐNG",
  DASHBOARD: "TỔNG QUAN",
};

const PERMISSION_LABELS: Record<string, string> = {
  [Permission.USER_VIEW]: "Xem danh sách",
  [Permission.USER_CREATE]: "Thêm mới",
  [Permission.USER_UPDATE]: "Cập nhật",
  [Permission.USER_DELETE]: "Xóa",
  [Permission.USER_SEARCH]: "Tìm kiếm",
  [Permission.USER_APPROVE]: "Phê duyệt",
  [Permission.USER_MANAGE]: "Quản lý nâng cao",

  [Permission.PRODUCT_VIEW]: "Xem danh sách",
  [Permission.PRODUCT_CREATE]: "Thêm mới",
  [Permission.PRODUCT_UPDATE]: "Cập nhật",
  [Permission.PRODUCT_DELETE]: "Xóa",
  [Permission.PRODUCT_SEARCH]: "Tìm kiếm",
  [Permission.PRODUCT_APPROVE]: "Phê duyệt",

  [Permission.CATEGORY_VIEW]: "Xem danh sách",
  [Permission.CATEGORY_CREATE]: "Thêm mới",
  [Permission.CATEGORY_UPDATE]: "Cập nhật",
  [Permission.CATEGORY_DELETE]: "Xóa",
  [Permission.CATEGORY_SEARCH]: "Tìm kiếm",
  [Permission.CATEGORY_APPROVE]: "Phê duyệt",

  [Permission.ORDER_VIEW]: "Xem danh sách",
  [Permission.ORDER_CREATE]: "Tạo đơn hàng",
  [Permission.ORDER_UPDATE]: "Sửa đơn (Thêm/Gỡ món ăn)",
  [Permission.ORDER_DELETE]: "Xóa lịch sử đơn (Mất dữ liệu)",
  [Permission.ORDER_SEARCH]: "Tìm kiếm",
  [Permission.ORDER_APPROVE]: "Phê duyệt",
  [Permission.ORDER_CANCEL]: "Hủy toàn bộ đơn hàng",

  [Permission.INVOICE_VIEW]: "Xem danh sách",
  [Permission.INVOICE_CREATE]: "Tạm tính / In hóa đơn",
  [Permission.INVOICE_SEARCH]: "Tìm kiếm",
  [Permission.INVOICE_APPROVE]: "Phê duyệt",
  [Permission.INVOICE_PAY]: "Thanh toán",
  [Permission.INVOICE_CANCEL]: "Hủy thanh toán sai / Khách đổi ý",

  [Permission.EMPLOYEE_VIEW]: "Xem danh sách",
  [Permission.EMPLOYEE_CREATE]: "Thêm mới",
  [Permission.EMPLOYEE_UPDATE]: "Cập nhật",
  [Permission.EMPLOYEE_DELETE]: "Xóa",
  [Permission.EMPLOYEE_SEARCH]: "Tìm kiếm",
  [Permission.EMPLOYEE_APPROVE]: "Phê duyệt",

  [Permission.AREA_VIEW]: "Xem danh sách",
  [Permission.AREA_CREATE]: "Thêm mới",
  [Permission.AREA_UPDATE]: "Cập nhật",
  [Permission.AREA_DELETE]: "Xóa",
  [Permission.AREA_SEARCH]: "Tìm kiếm",
  [Permission.AREA_APPROVE]: "Phê duyệt",

  [Permission.TABLE_VIEW]: "Xem danh sách",
  [Permission.TABLE_CREATE]: "Thêm mới",
  [Permission.TABLE_UPDATE]: "Cập nhật",
  [Permission.TABLE_DELETE]: "Xóa",
  [Permission.TABLE_SEARCH]: "Tìm kiếm",
  [Permission.TABLE_APPROVE]: "Phê duyệt",

  [Permission.APPROVAL_VIEW]: "Xem danh sách",
  [Permission.APPROVAL_CREATE]: "Gửi yêu cầu",
  [Permission.APPROVAL_UPDATE]: "Cập nhật yêu cầu",
  [Permission.APPROVAL_DELETE]: "Xóa yêu cầu",
  [Permission.APPROVAL_SEARCH]: "Tìm kiếm",
  [Permission.APPROVAL_APPROVE]: "Phê duyệt yêu cầu",
  [Permission.APPROVAL_MANAGE]: "Thực hiện phê duyệt",

  [Permission.ROLE_VIEW]: "Xem danh sách",
  [Permission.ROLE_CREATE]: "Thêm mới",
  [Permission.ROLE_UPDATE]: "Cập nhật",
  [Permission.ROLE_DELETE]: "Xóa",
  [Permission.ROLE_SEARCH]: "Tìm kiếm",
  [Permission.ROLE_APPROVE]: "Phê duyệt",

  [Permission.STATISTICS_VIEW]: "Xem thống kê",
  [Permission.STATISTICS_EXPORT]: "Xuất báo cáo",
  [Permission.STATISTICS_SEARCH]: "Tìm kiếm",
  [Permission.STATISTICS_APPROVE]: "Phê duyệt báo cáo",

  [Permission.AI_ASSISTANT_CHAT]: "Sử dụng trò chuyện",
  [Permission.AI_ASSISTANT_MANAGE]: "Quản lý trợ lý",
  [Permission.AI_ASSISTANT_SEARCH]: "Tìm kiếm",
  [Permission.AI_ASSISTANT_APPROVE]: "Phê duyệt AI",

  [Permission.NOTIFICATION_VIEW]: "Xem danh sách",
  [Permission.NOTIFICATION_CREATE]: "Thêm mới",
  [Permission.NOTIFICATION_UPDATE]: "Cập nhật",
  [Permission.NOTIFICATION_DELETE]: "Xóa",
  [Permission.NOTIFICATION_SEARCH]: "Tìm kiếm",
  [Permission.NOTIFICATION_APPROVE]: "Phê duyệt thông báo",

  [Permission.SETTING_MANAGE]: "Quản lý cài đặt",
  [Permission.LOG_VIEW]: "Xem nhật ký hệ thống",
  [Permission.LOG_DELETE]: "Xóa nhật ký",
  [Permission.LOGGING_VIEW]: "Xem nhật ký chi tiết",
  [Permission.LOGGING_DELETE]: "Xóa nhật ký chi tiết",

  [Permission.DASHBOARD_VIEW]: "Xem trang tổng quan",
};

export function RoleDialog({
  open,
  onOpenChange,
  role,
  onSuccess,
}: RoleDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (role) {
      setName(role.name);
      setDescription(role.description || "");
      setPermissions(role.permissions || []);
    } else {
      setName("");
      setDescription("");
      setPermissions([]);
    }
    setFormErrors({});
  }, [role, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = collectErrors({
      name: required(name),
      description: maxLength(description, 1000) || noHtml(description),
    });
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});
    setIsLoading(true);
    try {
      if (role) {
        await roleService.update(role.id, { name, description, permissions });
        toast.success("Cập nhật vai trò thành công");
      } else {
        await roleService.create({
          name,
          description,
          permissions,
          isActive: true,
        });
        toast.success("Tạo vai trò mới thành công");
      }
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast.error(role ? "Lỗi khi cập nhật vai trò" : "Lỗi khi tạo vai trò");
    } finally {
      setIsLoading(false);
    }
  };

  const togglePermission = (perm: Permission) => {
    setPermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm],
    );
  };

  const toggleGroup = (groupPerms: Permission[]) => {
    const allSelected = groupPerms.every((p) => permissions.includes(p));
    if (allSelected) {
      setPermissions((prev) => prev.filter((p) => !groupPerms.includes(p)));
    } else {
      setPermissions((prev) => [...new Set([...prev, ...groupPerms])]); // Add missing ones
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {role ? "Chỉnh sửa vai trò" : "Thêm vai trò mới"}
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-hidden flex flex-col gap-4"
        >
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="name" className="text-right mt-2">
                Tên vai trò <span className="text-destructive">*</span>
              </Label>
              <div className="col-span-3">
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (formErrors.name)
                      setFormErrors((p) => ({ ...p, name: "" }));
                  }}
                  className={inputErrorClass(formErrors.name)}
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
                {formErrors.name && (
                  <p className="text-xs text-destructive mt-1">
                    {formErrors.name}
                  </p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="description" className="text-right mt-2">
                Mô tả
              </Label>
              <div className="col-span-3">
                <Input
                  id="description"
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    if (formErrors.description)
                      setFormErrors((p) => ({ ...p, description: "" }));
                  }}
                  className={inputErrorClass(formErrors.description)}
                />
                {formErrors.description && (
                  <p className="text-xs text-destructive mt-1">
                    {formErrors.description}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex-1 border rounded-md p-4 flex flex-col min-h-0">
            <h3 className="mb-2 font-medium shrink-0">Phân quyền</h3>
            <div className="flex-1 overflow-y-auto min-h-0">
              <div className="grid grid-cols-2 gap-6 pr-2">
                {Object.entries(PERMISSION_GROUPS).map(([group, perms]) => (
                  <div key={group} className="space-y-2">
                    <div className="flex items-center space-x-2 pb-1 border-b">
                      <Checkbox
                        id={`group-${group}`}
                        checked={perms.every((p) => permissions.includes(p))}
                        onCheckedChange={() => toggleGroup(perms)}
                      />
                      <Label
                        htmlFor={`group-${group}`}
                        className="font-semibold cursor-pointer"
                      >
                        {GROUP_LABELS[group] || group} ({perms.length})
                      </Label>
                    </div>
                    <div className="grid gap-1 pl-4">
                      {perms.map((perm) => (
                        <div key={perm} className="flex items-center space-x-2">
                          <Checkbox
                            id={perm}
                            checked={permissions.includes(perm)}
                            onCheckedChange={() => togglePermission(perm)}
                          />
                          <Label
                            htmlFor={perm}
                            className="text-sm cursor-pointer font-normal"
                          >
                            {PERMISSION_LABELS[perm] || perm}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={isLoading}>
              {role ? "Lưu thay đổi" : "Tạo vai trò"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
