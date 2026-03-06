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
import { Input } from "@/components/ui/input";

import { Plus, Pencil, Trash2, Shield, Search, RotateCcw } from "lucide-react";
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
  const [searchInput, setSearchInput] = useState("");
  const [searchName, setSearchName] = useState("");

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

  const handleSearch = () => {
    setSearchName(searchInput);
  };

  const handleReset = () => {
    setSearchInput("");
    setSearchName("");
  };

  const filteredRoles = roles.filter((role) => {
    if (!searchName) return true;
    return role.name.toLowerCase().includes(searchName.toLowerCase());
  });

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground uppercase">
            Quản lý Vai trò
          </h2>
        </div>

        <div className="flex flex-wrap items-end justify-between w-full gap-4">
          {/* Left Spacer */}
          <div className="hidden lg:block lg:flex-1" />

          {/* Center: Search Input */}
          <div className="flex flex-col gap-1 w-full max-w-150">
            <label className="text-xs text-muted-foreground text-left">
              Tên vai trò
            </label>
            <Input
              placeholder="Tìm kiếm vai trò..."
              className="bg-background border-border rounded-lg h-10 w-full"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>

          {/* Right: Action Buttons */}
          <div className="flex-1 flex justify-end items-end gap-2 mb-0.5 min-w-fit">
            <Button
              onClick={handleSearch}
              className="gap-2 bg-[#00509E] hover:bg-[#00509E]/90 text-white rounded-lg"
            >
              <Search className="h-4 w-4" />
              Tìm kiếm
            </Button>
            <Button
              variant="outline"
              onClick={handleReset}
              className="gap-2 rounded-lg"
            >
              <RotateCcw className="h-4 w-4" />
              Làm mới
            </Button>
            <Button
              onClick={handleCreate}
              className="gap-2 bg-[#00509E] hover:bg-[#00509E]/90 text-white rounded-lg"
            >
              <Plus className="h-4 w-4" />
              Thêm vai trò
            </Button>
          </div>
        </div>

        <div>
          <h3 className="text-base font-semibold mb-3">Danh sách vai trò</h3>
          <div className="[&_th]:bg-muted [&_th]:text-muted-foreground [&_th]:font-semibold [&_td]:py-4">
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
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      Đang tải...
                    </TableCell>
                  </TableRow>
                ) : roles.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center py-8 text-muted-foreground"
                    >
                      Chưa có vai trò nào được tạo
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRoles.map((role) => (
                    <TableRow key={role.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2 text-blue-500">
                          <Shield className="w-4 h-4" />
                          {role.name}
                        </div>
                      </TableCell>
                      <TableCell>{role.description || "—"}</TableCell>
                      <TableCell>
                        <span className="px-2 py-1 rounded-full bg-muted text-xs font-medium">
                          {role.permissions?.length || 0} quyền
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end items-center gap-3 text-muted-foreground">
                          <button
                            className="hover:text-foreground transition-colors"
                            onClick={() => handleEdit(role)}
                            title="Chỉnh sửa"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            className="text-red-500 hover:text-red-600 transition-colors"
                            onClick={() => handleDeleteClick(role)}
                            title="Xóa"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
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
    </>
  );
}
