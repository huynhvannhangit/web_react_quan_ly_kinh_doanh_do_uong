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
  | "viewAll"
  | "viewId"
  | "create"
  | "update"
  | "delete"
  | "cancel"
  | "export"
  | "manageUser"
  | "manageApproval"
  | "manageSetting"
  | "viewLog"
  | "all";

interface MatrixRow {
  label: string;
  permissions: Partial<Record<ActionKey, Permission>>;
}

const MATRIX: MatrixRow[] = [
  {
    label: "Tổng quan",
    permissions: {
      viewAll: Permission.DASHBOARD_VIEW_ALL,
    },
  },
  {
    label: "Khu vực",
    permissions: {
      viewAll: Permission.AREA_VIEW_ALL,
      viewId: Permission.AREA_VIEW_ID,
      create: Permission.AREA_CREATE,
      update: Permission.AREA_UPDATE,
      delete: Permission.AREA_DELETE,
    },
  },
  {
    label: "Bàn",
    permissions: {
      viewAll: Permission.TABLE_VIEW_ALL,
      viewId: Permission.TABLE_VIEW_ID,
      create: Permission.TABLE_CREATE,
      update: Permission.TABLE_UPDATE,
      delete: Permission.TABLE_DELETE,
    },
  },
  {
    label: "Danh mục",
    permissions: {
      viewAll: Permission.CATEGORY_VIEW_ALL,
      viewId: Permission.CATEGORY_VIEW_ID,
      create: Permission.CATEGORY_CREATE,
      update: Permission.CATEGORY_UPDATE,
      delete: Permission.CATEGORY_DELETE,
    },
  },
  {
    label: "Sản phẩm",
    permissions: {
      viewAll: Permission.PRODUCT_VIEW_ALL,
      viewId: Permission.PRODUCT_VIEW_ID,
      create: Permission.PRODUCT_CREATE,
      update: Permission.PRODUCT_UPDATE,
      delete: Permission.PRODUCT_DELETE,
    },
  },
  {
    label: "Người dùng",
    permissions: {
      viewAll: Permission.USER_VIEW_ALL,
      viewId: Permission.USER_VIEW_ID,
      create: Permission.USER_CREATE,
      update: Permission.USER_UPDATE,
      delete: Permission.USER_DELETE,
      manageUser: Permission.USER_MANAGE,
    },
  },
  {
    label: "Vai trò",
    permissions: {
      viewAll: Permission.ROLE_VIEW_ALL,
      viewId: Permission.ROLE_VIEW_ID,
      create: Permission.ROLE_CREATE,
      update: Permission.ROLE_UPDATE,
      delete: Permission.ROLE_DELETE,
    },
  },
  {
    label: "Đơn hàng",
    permissions: {
      viewAll: Permission.ORDER_VIEW_ALL,
      viewId: Permission.ORDER_VIEW_ID,
      create: Permission.ORDER_CREATE,
      update: Permission.ORDER_UPDATE,
      delete: Permission.ORDER_DELETE,
      cancel: Permission.ORDER_CANCEL,
    },
  },
  {
    label: "Hoá đơn",
    permissions: {
      viewAll: Permission.INVOICE_VIEW_ALL,
      viewId: Permission.INVOICE_VIEW_ID,
      create: Permission.INVOICE_CREATE,
      update: Permission.INVOICE_PAY,
      cancel: Permission.INVOICE_CANCEL,
    },
  },
  {
    label: "Thống kê",
    permissions: {
      viewAll: Permission.STATISTICS_VIEW_ALL,
      export: Permission.STATISTICS_EXPORT,
    },
  },
  {
    label: "Trợ lý AI",
    permissions: {
      viewAll: Permission.AI_ASSISTANT_CHAT,
    },
  },
  {
    label: "Phê duyệt",
    permissions: {
      viewAll: Permission.APPROVAL_VIEW_ALL,
      viewId: Permission.APPROVAL_VIEW_ID,
      delete: Permission.APPROVAL_DELETE,
      manageApproval: Permission.APPROVAL_MANAGE,
    },
  },
  {
    label: "Hệ thống",
    permissions: {
      viewLog: Permission.LOG_VIEW_ALL,
      manageSetting: Permission.SETTING_MANAGE,
    },
  },
];

// Column definitions
const COLUMNS: { key: ActionKey; label: string }[] = [
  { key: "viewAll", label: "Xem" },
  { key: "create", label: "Thêm" },
  { key: "viewId", label: "Chi tiết" },
  { key: "update", label: "Sửa" },
  { key: "delete", label: "Xóa" },
  { key: "export", label: "Xuất file" },
  { key: "cancel", label: "Hủy" },
  { key: "manageUser", label: "QL Vai trò" },
  { key: "manageApproval", label: "Duyệt" },
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

  const toggle = (perm: Permission) => {
    setPermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm],
    );
  };

  // Toggle all permissions in a row
  const toggleRow = (row: MatrixRow) => {
    const rowPerms = Object.values(row.permissions) as Permission[];
    const allChecked = rowPerms.every((p) => permissions.includes(p));
    if (allChecked) {
      setPermissions((prev) => prev.filter((p) => !rowPerms.includes(p)));
    } else {
      setPermissions((prev) => [...new Set([...prev, ...rowPerms])]);
    }
  };

  const isRowAllChecked = (row: MatrixRow) => {
    const rowPerms = Object.values(row.permissions) as Permission[];
    return (
      rowPerms.length > 0 && rowPerms.every((p) => permissions.includes(p))
    );
  };

  const isRowPartialChecked = (row: MatrixRow) => {
    const rowPerms = Object.values(row.permissions) as Permission[];
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

                              const checked = permissions.includes(perm);
                              return (
                                <label
                                  key={col.key}
                                  className="inline-flex items-center gap-2 cursor-pointer select-none"
                                >
                                  <Checkbox
                                    id={perm}
                                    checked={checked}
                                    onCheckedChange={() => toggle(perm)}
                                    className="data-[state=checked]:bg-[#0b5c9b] data-[state=checked]:border-[#0b5c9b]"
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
    </Dialog>
  );
}
