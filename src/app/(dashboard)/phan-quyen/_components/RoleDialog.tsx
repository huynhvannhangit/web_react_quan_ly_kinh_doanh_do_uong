// cspell:disable
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
import { ApprovalReasonDialog } from "@/components/shared/ApprovalReasonDialog";
import { useAuth } from "@/components/providers/auth-provider";

interface RoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role?: Role;
  onSuccess: () => void;
}
// ─── Permission Matrix Definition ───────────────────────────────────────────
// Each module row defines which permission maps to which action column.
// null = not applicable for that module.

type ActionKey =
  | "sidebar"
  | "view"
  | "create"
  | "update"
  | "delete"
  | "lock"
  | "cancel"
  | "export"
  | "manageUser"
  | "manageApproval"
  | "manageSetting"
  | "viewLog"
  | "pay"
  | "approve"
  | "viewReport"
  | "all";

interface MatrixRow {
  label: string;
  permissions: Partial<Record<ActionKey, Permission | Permission[]>>;
}

const MATRIX: MatrixRow[] = [
  {
    label: "Tổng quan",
    permissions: {
      sidebar: Permission.DASHBOARD_MENU,
      view: Permission.DASHBOARD_VIEW,
    },
  },
  {
    label: "Khu vực",
    permissions: {
      sidebar: Permission.AREA_MENU,
      view: Permission.AREA_VIEW,
      create: Permission.AREA_CREATE,
      update: Permission.AREA_UPDATE,
      delete: Permission.AREA_DELETE,
      approve: Permission.AREA_APPROVE,
    },
  },
  {
    label: "Bàn",
    permissions: {
      sidebar: Permission.TABLE_MENU,
      view: Permission.TABLE_VIEW,
      create: Permission.TABLE_CREATE,
      update: Permission.TABLE_UPDATE,
      delete: Permission.TABLE_DELETE,
      approve: Permission.TABLE_APPROVE,
    },
  },
  {
    label: "Danh mục",
    permissions: {
      sidebar: Permission.CATEGORY_MENU,
      view: Permission.CATEGORY_VIEW,
      create: Permission.CATEGORY_CREATE,
      update: Permission.CATEGORY_UPDATE,
      delete: Permission.CATEGORY_DELETE,
      approve: Permission.CATEGORY_APPROVE,
    },
  },
  {
    label: "Sản phẩm",
    permissions: {
      sidebar: Permission.PRODUCT_MENU,
      view: Permission.PRODUCT_VIEW,
      create: Permission.PRODUCT_CREATE,
      update: Permission.PRODUCT_UPDATE,
      delete: Permission.PRODUCT_DELETE,
      approve: Permission.PRODUCT_APPROVE,
    },
  },
  {
    label: "Nhân viên",
    permissions: {
      sidebar: Permission.EMPLOYEE_MENU,
      view: Permission.EMPLOYEE_VIEW,
      create: Permission.EMPLOYEE_CREATE,
      update: Permission.EMPLOYEE_UPDATE,
      delete: Permission.EMPLOYEE_DELETE,
      approve: Permission.EMPLOYEE_APPROVE,
    },
  },
  {
    label: "Tài khoản",
    permissions: {
      sidebar: Permission.USER_MENU,
      view: Permission.USER_VIEW,
      create: Permission.USER_CREATE,
      update: Permission.USER_UPDATE,
      delete: Permission.USER_DELETE,
      approve: Permission.USER_APPROVE,
    },
  },
  {
    label: "Vai trò",
    permissions: {
      sidebar: Permission.ROLE_MENU,
      view: Permission.ROLE_VIEW,
      create: Permission.ROLE_CREATE,
      update: Permission.ROLE_UPDATE,
      delete: Permission.ROLE_DELETE,
      approve: Permission.ROLE_APPROVE,
    },
  },
  {
    label: "Phân quyền",
    permissions: {
      manageUser: Permission.USER_MANAGE,
    },
  },
  {
    label: "Phê duyệt",
    permissions: {
      sidebar: Permission.APPROVAL_MENU,
      view: Permission.APPROVAL_VIEW,
      approve: [Permission.APPROVAL_APPROVE, Permission.APPROVAL_REJECT],
    },
  },
  {
    label: "Đơn hàng",
    permissions: {
      sidebar: Permission.ORDER_MENU,
      view: Permission.ORDER_VIEW,
      create: Permission.ORDER_CREATE,
      update: Permission.ORDER_UPDATE,
      cancel: Permission.ORDER_CANCEL,
    },
  },
  {
    label: "Hoá đơn",
    permissions: {
      sidebar: Permission.INVOICE_MENU,
      view: Permission.INVOICE_VIEW,
      pay: Permission.INVOICE_PAY,
      delete: Permission.INVOICE_CANCEL,
      approve: Permission.INVOICE_APPROVE,
    },
  },
  {
    label: "Thống kê",
    permissions: {
      sidebar: Permission.STATISTICS_MENU,
      view: Permission.STATISTICS_VIEW,
      export: Permission.STATISTICS_EXPORT,
    },
  },
  {
    label: "AI Assistant",
    permissions: {
      sidebar: Permission.AI_ASSISTANT_MENU,
      view: Permission.AI_ASSISTANT_CHAT,
    },
  },
  {
    label: "Cấu hình",
    permissions: {
      sidebar: Permission.SETTING_MENU,
      manageSetting: Permission.SETTING_MANAGE,
    },
  },
  {
    label: "Nhật ký",
    permissions: {
      sidebar: Permission.LOGGING_MENU,
      viewLog: Permission.LOGGING_VIEW,
    },
  },
];

// Column definitions
const COLUMNS: { key: ActionKey; label: string }[] = [
  { key: "sidebar", label: "Menu" },
  { key: "view", label: "Xem" },
  { key: "create", label: "Thêm" },
  { key: "update", label: "Sửa" },
  { key: "delete", label: "Xóa" },
  { key: "approve", label: "Duyệt" },
  { key: "pay", label: "Thanh toán" },
  { key: "cancel", label: "Hủy" },
  { key: "export", label: "Xuất file" },
  { key: "manageUser", label: "Phân quyền" },
  { key: "manageApproval", label: "Cấu hình duyệt" },
  { key: "manageSetting", label: "Cấu hình" },
  { key: "viewLog", label: "Xem nhật ký" },
  { key: "all", label: "Tất cả" },
];

export function RoleDialog({
  open,
  onOpenChange,
  role,
  onSuccess,
}: RoleDialogProps) {
  const { user } = useAuth();
  const isAdmin = (user?.role as Role)?.name === "ADMIN" || (user?.role as Role)?.name === "CHỦ CỬA HÀNG";

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [openReason, setOpenReason] = useState(false);

  useEffect(() => {
    if (role) {
      setName(role.name);
      setDescription(role.description || "");
      // Filter out permissions that are no longer in the enum to avoid 400 errors
      const validPermissions = (role.permissions || []).filter((p) =>
        Object.values(Permission).includes(p as Permission),
      );
      setPermissions(validPermissions);
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

    if (!isAdmin) {
      setOpenReason(true);
      return;
    }

    await performSubmit();
  };

  const handleReasonSubmit = async (reason: string) => {
    await performSubmit(reason);
    setOpenReason(false);
  };

  const performSubmit = async (reason?: string) => {
    setIsLoading(true);
    try {
      if (role) {
        await roleService.update(role.id, { name, description, permissions }, reason);
        toast.success(isAdmin ? "Cập nhật vai trò thành công" : "Đã gửi yêu cầu cập nhật vai trò");
      } else {
        await roleService.create({
          name,
          description,
          permissions,
          isActive: true,
        }, reason);
        toast.success(isAdmin ? "Tạo vai trò mới thành công" : "Đã gửi yêu cầu tạo vai trò mới");
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
// ... rest of toggle and matrix logic ...

  const toggle = (perm: Permission | Permission[]) => {
    const targetPerms = Array.isArray(perm) ? perm : [perm];
    setPermissions((prev) => {
      const allPresent = targetPerms.every((p) => prev.includes(p));
      if (allPresent) {
        return prev.filter((p) => !targetPerms.includes(p));
      } else {
        return [...new Set([...prev, ...targetPerms])];
      }
    });
  };

  // Toggle all permissions in a row
  const toggleRow = (row: MatrixRow) => {
    const rowPerms = Object.values(row.permissions).flat() as Permission[];
    const allChecked = rowPerms.every((p) => permissions.includes(p));
    if (allChecked) {
      setPermissions((prev) => prev.filter((p) => !rowPerms.includes(p)));
    } else {
      setPermissions((prev) => [...new Set([...prev, ...rowPerms])]);
    }
  };

  const isRowAllChecked = (row: MatrixRow) => {
    const rowPerms = Object.values(row.permissions).flat() as Permission[];
    return (
      rowPerms.length > 0 && rowPerms.every((p) => permissions.includes(p))
    );
  };

  const isRowPartialChecked = (row: MatrixRow) => {
    const rowPerms = Object.values(row.permissions).flat() as Permission[];
    return (
      rowPerms.some((p) => permissions.includes(p)) && !isRowAllChecked(row)
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[92vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {role ? "Chỉnh sửa vai trò" : "Thêm vai trò mới"}
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-hidden flex flex-col gap-4"
        >
          {/* Name & Description */}
          <div className="grid gap-3">
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

          {/* Permission Matrix */}
          <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
            <div className="flex-1 overflow-auto">
              <table className="w-full text-sm">
                <tbody>
                  {MATRIX.map((row) => {
                    const rowAllChecked = isRowAllChecked(row);
                    const rowPartial = isRowPartialChecked(row);
                    return (
                      <tr
                        key={row.label}
                        className="bg-background hover:bg-muted/30"
                      >
                        {/* Module name */}
                        <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap align-middle w-[15%]">
                          {row.label}
                        </td>

                        {/* Action columns flex container */}
                        <td className="px-4 py-3 w-full">
                          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                            {COLUMNS.map((col) => {
                              if (col.key === "all") return null;

                              const perm = row.permissions[col.key];
                              if (!perm) return null;

                              const perms = Array.isArray(perm) ? perm : [perm];
                              const checked = perms.every((p) =>
                                permissions.includes(p),
                              );
                              const indeterminate =
                                !checked &&
                                perms.some((p) => permissions.includes(p));

                              return (
                                <label
                                  key={col.key}
                                  className="inline-flex items-center gap-2 cursor-pointer select-none"
                                >
                                  <Checkbox
                                    id={perms[0]}
                                    checked={
                                      checked
                                        ? true
                                        : indeterminate
                                          ? "indeterminate"
                                          : false
                                    }
                                    onCheckedChange={() => toggle(perm)}
                                    className="data-[state=checked]:bg-[#0b5c9b] data-[state=checked]:border-[#0b5c9b] data-[state=indeterminate]:bg-[#0b5c9b] data-[state=indeterminate]:border-[#0b5c9b]"
                                  />
                                  <span className="text-sm whitespace-nowrap">
                                    {col.label}
                                  </span>
                                </label>
                              );
                            })}
                          </div>
                        </td>

                        {/* "Tất cả" column */}
                        <td className="px-4 py-3 align-middle whitespace-nowrap w-28 border-l border-border/40">
                          <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                            <Checkbox
                              checked={
                                rowAllChecked
                                  ? true
                                  : rowPartial
                                    ? "indeterminate"
                                    : false
                              }
                              onCheckedChange={() => toggleRow(row)}
                              className="data-[state=checked]:bg-[#0b5c9b] data-[state=checked]:border-[#0b5c9b] data-[state=indeterminate]:bg-[#0b5c9b] data-[state=indeterminate]:border-[#0b5c9b]"
                            />
                            <span className="text-sm font-medium">Tất cả</span>
                          </label>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <DialogFooter className="pt-2 shrink-0">
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
      <ApprovalReasonDialog
        open={openReason}
        onOpenChange={setOpenReason}
        onConfirm={handleReasonSubmit}
        isLoading={isLoading}
        actionTitle={role ? "Lý do cập nhật vai trò" : "Lý do tạo vai trò"}
      />
    </Dialog>
  );
}
