"use client";

import { useEffect, useState } from "react";
import { Role, roleService } from "@/services/role.service";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, Shield } from "lucide-react";
import { RoleDialog } from "./RoleDialog";
import { DeleteRoleDialog } from "./delete-role-dialog";
import { toast } from "sonner";

export function RoleList() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | undefined>(undefined);
  const [openDelete, setOpenDelete] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchRoles = async () => {
    setIsLoading(true);
    try {
      const data = await roleService.getAll();
      setRoles(data);
    } catch {
      toast.error("Không thể tải danh sách vai trò");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleCreate = () => {
    setSelectedRole(undefined);
    setOpenDialog(true);
  };

  const handleEdit = (role: Role) => {
    setSelectedRole(role);
    setOpenDialog(true);
  };

  const handleDeleteClick = (role: Role) => {
    setRoleToDelete(role);
    setOpenDelete(true);
  };

  const handleConfirmDelete = async () => {
    if (!roleToDelete) return;
    setIsDeleting(true);
    try {
      await roleService.delete(roleToDelete.id);
      toast.success("Xóa vai trò thành công");
      fetchRoles();
    } catch {
      toast.error("Không thể xóa vai trò");
    } finally {
      setIsDeleting(false);
      setOpenDelete(false);
      setRoleToDelete(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Danh sách vai trò</h2>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Thêm vai trò
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tên vai trò</TableHead>
              <TableHead>Mô tả</TableHead>
              <TableHead>Số quyền</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {roles.length === 0 && !isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center py-8 text-muted-foreground"
                >
                  Chưa có vai trò nào được tạo
                </TableCell>
              </TableRow>
            ) : (
              roles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-primary" />
                      {role.name}
                    </div>
                  </TableCell>
                  <TableCell>{role.description || "-"}</TableCell>
                  <TableCell>{role.permissions?.length || 0} quyền</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(role)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => handleDeleteClick(role)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <RoleDialog
        open={openDialog}
        onOpenChange={setOpenDialog}
        role={selectedRole}
        onSuccess={fetchRoles}
      />

      <DeleteRoleDialog
        open={openDelete}
        onOpenChange={setOpenDelete}
        role={roleToDelete}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
      />
    </div>
  );
}
