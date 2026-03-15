// cspell:disable
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
import { Pagination } from "@/components/shared/Pagination";

import { Plus, Pencil, Trash2, Search, RotateCcw } from "lucide-react";
import { RoleDialog } from "./RoleDialog";
import { DeleteRoleDialog } from "./delete-role-dialog";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/components/providers/auth-provider";
import { Permission } from "@/types";
import { ApprovalReasonDialog } from "@/components/shared/ApprovalReasonDialog";

export function RoleList() {
  const { user } = useAuth();
  const isAdmin = (user?.role as Role)?.name === "ADMIN" || (user?.role as Role)?.name === "CHỦ CỬA HÀNG";
  const canCreate = user?.permissions?.includes(Permission.ROLE_CREATE);
  const canUpdate = user?.permissions?.includes(Permission.ROLE_UPDATE);
  const canDelete = user?.permissions?.includes(Permission.ROLE_DELETE);

  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | undefined>(undefined);
  const [openDelete, setOpenDelete] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [searchName, setSearchName] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const [openReason, setOpenReason] = useState(false);

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

  const handleDeleteClickWrapper = async () => {
    if (!isAdmin) {
      setOpenReason(true);
      return;
    }
    await handleConfirmDelete();
  };

  const handleReasonSubmit = async (reason: string) => {
    await handleConfirmDelete(reason);
    setOpenReason(false);
  };

  const handleConfirmDelete = async (reason?: string) => {
    if (!roleToDelete) return;
    setIsDeleting(true);
    try {
      await roleService.delete(roleToDelete.id, reason);
      toast.success(isAdmin ? "Xóa vai trò thành công" : "Đã gửi yêu cầu xóa vai trò");
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
    setCurrentPage(1);
    fetchRoles();
  };

  const filteredRoles = roles.filter((role) => {
    return role.name.toLowerCase().includes(searchName.toLowerCase());
  });

  const totalPages = Math.ceil(filteredRoles.length / pageSize);
  const paginatedRoles = filteredRoles.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  const globalOffset = (currentPage - 1) * pageSize;

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
            {canCreate && (
              <Button
                onClick={handleCreate}
                className="gap-2 bg-[#00509E] hover:bg-[#00509E]/90 text-white rounded-lg"
              >
                <Plus className="h-4 w-4" />
                Thêm vai trò
              </Button>
            )}
          </div>
        </div>

        <Card className="border-none shadow-none">
          <CardHeader className="flex flex-row items-center justify-between pb-4 px-0">
            <CardTitle className="text-lg font-semibold text-foreground">
              Danh sách vai trò
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            <div className="overflow-x-auto [&_th]:bg-muted [&_th]:text-muted-foreground [&_th]:font-semibold [&_td]:py-4">
              <Table className="min-w-325 font-sans">
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-border">
                    <TableHead className="w-16 text-center">STT</TableHead>
                    <TableHead>Tên vai trò</TableHead>
                    <TableHead>Mô tả</TableHead>
                    <TableHead>Số quyền</TableHead>
                    {(canUpdate || canDelete) && (
                      <TableHead className="text-right">Thao tác</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        Đang tải...
                      </TableCell>
                    </TableRow>
                  ) : filteredRoles.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center py-8 text-muted-foreground"
                      >
                        Chưa có vai trò nào được tạo
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedRoles.map((role, index) => (
                      <TableRow key={role.id}>
                        <TableCell className="text-center font-medium text-slate-500">
                          {globalOffset + index + 1}
                        </TableCell>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2 text-blue-500">
                            {role.name}
                          </div>
                        </TableCell>
                        <TableCell>{role.description || "—"}</TableCell>
                        <TableCell>
                          <span className="px-2 py-1 rounded-full bg-muted text-xs font-medium">
                            {role.permissions?.length || 0} quyền
                          </span>
                        </TableCell>
                        {(canUpdate || canDelete) && (
                          <TableCell className="text-right">
                            <div className="flex justify-end items-center gap-3 text-muted-foreground">
                              {canUpdate && (
                                <button
                                  className="hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  onClick={() => handleEdit(role)}
                                  disabled={isDeleting}
                                  title="Chỉnh sửa"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                              )}
                              {canDelete && (
                                <button
                                  className="text-red-500 hover:text-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  onClick={() => handleDeleteClick(role)}
                                  disabled={isDeleting}
                                  title="Xóa"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredRoles.length}
              onPageChange={setCurrentPage}
            />
          </CardContent>
        </Card>
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
        onConfirm={handleDeleteClickWrapper}
        isLoading={isDeleting}
      />

      <ApprovalReasonDialog
        open={openReason}
        onOpenChange={setOpenReason}
        onConfirm={handleReasonSubmit}
        isLoading={isDeleting}
        actionTitle="Xóa vai trò"
      />
    </>
  );
}
