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
    Permission.USER_MANAGE,
  ],
  PRODUCT: [
    Permission.PRODUCT_VIEW,
    Permission.PRODUCT_CREATE,
    Permission.PRODUCT_UPDATE,
    Permission.PRODUCT_DELETE,
  ],
  ORDER: [
    Permission.ORDER_VIEW,
    Permission.ORDER_CREATE,
    Permission.ORDER_UPDATE,
    Permission.ORDER_DELETE,
    Permission.ORDER_CANCEL,
  ],
  INVOICE: [
    Permission.INVOICE_VIEW,
    Permission.INVOICE_CREATE,
    Permission.INVOICE_UPDATE,
    Permission.INVOICE_DELETE,
    Permission.INVOICE_PAY,
  ],
  EMPLOYEE: [
    Permission.EMPLOYEE_VIEW,
    Permission.EMPLOYEE_CREATE,
    Permission.EMPLOYEE_UPDATE,
    Permission.EMPLOYEE_DELETE,
  ],
  AREA: [
    Permission.AREA_VIEW,
    Permission.AREA_CREATE,
    Permission.AREA_UPDATE,
    Permission.AREA_DELETE,
  ],
  TABLE: [
    Permission.TABLE_VIEW,
    Permission.TABLE_CREATE,
    Permission.TABLE_UPDATE,
    Permission.TABLE_DELETE,
  ],
  APPROVAL: [
    Permission.APPROVAL_VIEW,
    Permission.APPROVAL_CREATE,
    Permission.APPROVAL_UPDATE,
    Permission.APPROVAL_DELETE,
    Permission.APPROVAL_MANAGE,
  ],
  STATISTICS: [Permission.STATISTICS_VIEW, Permission.STATISTICS_EXPORT],
  AI_ASSISTANT: [Permission.AI_ASSISTANT_CHAT, Permission.AI_ASSISTANT_MANAGE],
  SYSTEM: [
    Permission.SETTING_MANAGE,
    Permission.LOG_VIEW,
    Permission.LOG_DELETE,
  ],
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
  }, [role, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

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
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Tên vai trò
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Mô tả
              </Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="col-span-3"
              />
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
                        {group} ({perms.length})
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
                            {perm}
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
