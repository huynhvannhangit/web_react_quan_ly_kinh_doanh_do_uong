"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Role, roleService } from "@/services/role.service";
import { User, userService } from "@/services/user.service";
import { toast } from "sonner";

interface UserRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  onSuccess: () => void;
}

export function UserRoleDialog({
  open,
  onOpenChange,
  user,
  onSuccess,
}: UserRoleDialogProps) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    const fetchRoles = async () => {
      try {
        const data = await roleService.getAll();
        setRoles(data);
      } catch {
        console.error("Failed to load roles");
      }
    };
    fetchRoles();
  }, [open]);

  useEffect(() => {
    if (user && open) {
      // Handle user.role being object or string (though backend usually returns object or null if eager loaded)
      // If object, take id.
      const currentRoleId =
        typeof user.role === "object" && user.role !== null
          ? (user.role as Role).id
          : "";
      setSelectedRoleId(currentRoleId ? String(currentRoleId) : "");
    } else {
      setSelectedRoleId("");
    }
  }, [user, open]);

  const handleSubmit = async () => {
    if (!user || !selectedRoleId) return;

    setIsLoading(true);
    try {
      await userService.update(user.id, { roleId: Number(selectedRoleId) });
      toast.success("Cập nhật vai trò người dùng thành công");
      onSuccess();
      onOpenChange(false);
    } catch {
      toast.error("Lỗi khi cập nhật vai trò");
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Phân quyền người dùng</DialogTitle>
          <DialogDescription>
            Gán vai trò cho người dùng{" "}
            <span className="font-semibold">{user.fullName}</span> ({user.email}
            )
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="role" className="text-right">
              Vai trò
            </Label>
            <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Chọn vai trò" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={String(role.id)}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Hủy
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !selectedRoleId}
          >
            Lưu thay đổi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
