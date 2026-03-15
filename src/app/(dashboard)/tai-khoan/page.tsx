// cspell:disable
"use client";

import React, { useEffect, useState, useCallback } from "react";
import { userService, User, UpdateUserDto, CreateUserDto } from "@/services/user.service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Lock,
  Unlock,
  Search,
  RotateCcw,
  Plus,
  Pencil,
  Trash2,
  Loader2,
} from "lucide-react";
import { Pagination } from "@/components/shared/Pagination";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Permission } from "@/types";
import { PermissionGuard } from "@/components/shared/PermissionGuard";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useAuth } from "@/components/providers/auth-provider";
import { ApprovalReasonDialog } from "@/components/shared/ApprovalReasonDialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { roleService, Role } from "@/services/role.service";
import {
  collectErrors,
  required,
  noSpecialChars,
  inputErrorClass,
} from "@/lib/validators";

export default function AccountPage() {
  const { user } = useAuth();
  const roleName =
    typeof user?.role === "string"
      ? user.role
      : (user?.role as { name?: string } | null)?.name;
  const isAdmin = roleName === "ADMIN" || roleName === "CHỦ CỬA HÀNG";

  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    email: "",
    fullName: "",
    password: "",
    roleId: "",
    status: "ACTIVE",
  });

  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
    isDanger?: boolean;
  }>({
    isOpen: false,
    title: "",
    description: "",
    onConfirm: () => {},
  });

  // Approval Dialog States
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    type: "create" | "update" | "delete" | "toggleStatus";
    data?: Record<string, unknown>;
    id?: number;
    email?: string;
  } | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const userData = await userService.getAll();
      setUsers(userData);

      if (
        user?.permissions?.includes(Permission.USER_CREATE) ||
        user?.permissions?.includes(Permission.USER_UPDATE)
      ) {
        try {
          const roleData = await roleService.getAll();
          setRoles(roleData);
        } catch (roleError) {
          console.error("Failed to load roles:", roleError);
        }
      }
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.permissions]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const resetForm = () => {
    setFormData({
      email: "",
      fullName: "",
      password: "",
      roleId: "",
      status: "ACTIVE",
    });
    setEditingUser(null);
    setIsEditMode(false);
    setFormErrors({});
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setIsEditMode(true);
    setFormData({
      email: user.email,
      fullName: user.fullName || "",
      password: "", // Don't populate password
      roleId:
        typeof user.role === "object"
          ? (user.role as Role).id.toString()
          : user.role || "",
      status: (user.status as string) || "ACTIVE",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (user: User) => {
    setConfirmState({
      isOpen: true,
      title: "Xác nhận xóa tài khoản",
      description: `Bạn có chắc muốn xóa tài khoản "${user.email}"? Hành động này không thể hoàn tác.`,
      isDanger: true,
      onConfirm: async () => {
        if (!isAdmin) {
          setPendingAction({ type: "delete", id: user.id, email: user.email });
          setIsApprovalDialogOpen(true);
          setConfirmState((prev) => ({ ...prev, isOpen: false }));
          return;
        }
        try {
          await userService.remove(user.id);
          toast.success("Xóa tài khoản thành công");
        } catch (error) {
          console.error("Failed to delete account:", error);
          toast.error("Xóa tài khoản thất bại!");
        } finally {
          setConfirmState((prev) => ({ ...prev, isOpen: false }));
          loadData();
        }
      },
    });
  };

  const handleSubmit = async () => {
    const errors = collectErrors({
      email: required(formData.email),
      fullName:
        required(formData.fullName) || noSpecialChars(formData.fullName),
      roleId: required(formData.roleId),
      password: !isEditMode ? required(formData.password) : "",
    });

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    setIsSaving(true);
    try {
      const payload = {
        email: formData.email,
        fullName: formData.fullName,
        password: formData.password || undefined,
        roleId: parseInt(formData.roleId),
        status: formData.status,
      };

      if (isEditMode && editingUser) {
        if (!isAdmin) {
          setPendingAction({
            type: "update",
            id: editingUser.id,
            data: payload,
            email: editingUser.email,
          });
          setIsApprovalDialogOpen(true);
          setIsDialogOpen(false);
          return;
        }
        await userService.update(editingUser.id, payload);
        toast.success("Cập nhật tài khoản thành công");
      } else {
        if (!isAdmin) {
          setPendingAction({
            type: "create",
            data: payload,
            email: formData.email,
          });
          setIsApprovalDialogOpen(true);
          setIsDialogOpen(false);
          return;
        }
        await userService.create(payload);
        toast.success("Thêm tài khoản thành công");
      }

      setIsDialogOpen(false);
      resetForm();
    } catch (error: unknown) {
      console.error("Failed to save user:", error);
      const msg =
        (error as { response?: { data?: { message?: string } } }).response?.data
          ?.message || "Lưu thông tin thất bại!";
      toast.error(msg);
    } finally {
      setIsSaving(false);
      loadData();
    }
  };

  const handleToggleStatus = (user: User) => {
    const isCurrentlyActive = user.status === "ACTIVE";
    const newStatus = isCurrentlyActive ? "INACTIVE" : "ACTIVE";
    const actionText = isCurrentlyActive ? "khoá" : "mở khoá";

    setConfirmState({
      isOpen: true,
      title: `Xác nhận ${actionText} tài khoản`,
      description: `Bạn có chắc muốn ${actionText} tài khoản "${user.email}"?`,
      isDanger: isCurrentlyActive,
      onConfirm: async () => {
        if (!isAdmin) {
          setPendingAction({
            type: "toggleStatus",
            id: user.id,
            email: user.email,
            data: { status: newStatus },
          });
          setIsApprovalDialogOpen(true);
          setConfirmState((prev) => ({ ...prev, isOpen: false }));
          return;
        }
        try {
          setIsProcessing(true);
          await userService.update(user.id, { status: newStatus });
          toast.success(
            `${isCurrentlyActive ? "Khoá" : "Mở khoá"} tài khoản thành công`,
          );
        } catch (error: unknown) {
          console.error(`Failed to ${actionText} account:`, error);
          const msg =
            (error as { response?: { data?: { message?: string } } }).response
              ?.data?.message || `Thao tác thất bại!`;
          toast.error(msg);
        } finally {
          setConfirmState((prev) => ({ ...prev, isOpen: false }));
          loadData();
        }
      },
    });
  };

  const handleConfirmApproval = async (reason: string) => {
    if (!pendingAction) return;

    try {
      setIsProcessing(true);
      if (pendingAction.type === "update" && pendingAction.id) {
        await userService.update(
          pendingAction.id,
          pendingAction.data as UpdateUserDto,
          reason,
        );
        toast.success("Đã gửi yêu cầu cập nhật tài khoản");
        resetForm();
      } else if (pendingAction.type === "toggleStatus" && pendingAction.id) {
        await userService.update(
          pendingAction.id,
          pendingAction.data as UpdateUserDto,
          reason,
        );
        toast.success("Đã gửi yêu cầu thay đổi trạng thái");
      } else if (pendingAction.type === "delete" && pendingAction.id) {
        await userService.remove(pendingAction.id, reason);
        toast.success("Đã gửi yêu cầu xóa tài khoản");
      } else if (pendingAction.type === "create") {
        await userService.create(pendingAction.data as unknown as CreateUserDto, reason);
        toast.success("Đã gửi yêu cầu tạo tài khoản mới");
        resetForm();
      }
    } catch (error) {
      console.error("Approval request failed:", error);
      toast.error("Gửi yêu cầu phê duyệt thất bại!");
    } finally {
      setIsProcessing(false);
      setIsApprovalDialogOpen(false);
      setPendingAction(null);
      loadData();
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.fullName || "").toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  const globalOffset = (currentPage - 1) * pageSize;

  return (
    <PermissionGuard permissions={[Permission.USER_VIEW]} redirect="/dashboard">
      <Card>
        <CardContent className="p-8 space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold tracking-wide text-[#00509E] dark:text-blue-400 uppercase">
              Quản lý tài khoản hệ thống
            </h1>
          </div>

          <div className="flex flex-wrap items-end justify-between mt-6 w-full gap-4">
            <div className="hidden lg:block lg:flex-1" />

            <div className="flex flex-col gap-1 w-full max-w-150">
              <label className="text-xs text-muted-foreground text-left">
                Email / Họ tên
              </label>
              <Input
                placeholder="Tìm e-mail hoặc họ tên..."
                className="bg-background border-border rounded-lg h-10 w-full"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>

            <div className="flex-1 flex justify-end items-end gap-2 mb-0.5 min-w-fit">
              <Button
                onClick={() => loadData()}
                className="gap-2 bg-[#00509E] hover:bg-[#00509E]/90 text-white rounded-lg"
                disabled={isLoading}
              >
                <Search
                  className={cn("h-4 w-4", isLoading && "animate-spin")}
                />
                Tìm kiếm
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setCurrentPage(1);
                  loadData();
                }}
                className="gap-2 rounded-lg"
              >
                <RotateCcw className="h-4 w-4" />
                Làm mới
              </Button>

              <PermissionGuard permissions={[Permission.USER_CREATE]}>
                <Button
                  className="bg-[#00509E] hover:bg-[#00509E]/90 text-white h-10 rounded-lg px-6"
                  onClick={() => {
                    resetForm();
                    setIsDialogOpen(true);
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" /> Thêm
                </Button>
              </PermissionGuard>
            </div>
          </div>

          <Card className="border-none shadow-none">
            <CardHeader className="flex flex-row items-center justify-between pb-4 px-0">
              <CardTitle className="text-lg font-semibold text-foreground">
                Danh sách tài khoản
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0">
              <div className="overflow-x-auto [&_th]:bg-muted [&_th]:text-muted-foreground [&_th]:font-semibold [&_td]:py-4">
                <Table className="min-w-325 font-sans">
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-border">
                      <TableHead className="w-14 text-center whitespace-nowrap">
                        STT
                      </TableHead>
                      <TableHead className="whitespace-nowrap">Email</TableHead>
                      <TableHead className="whitespace-nowrap">
                        Họ tên
                      </TableHead>
                      <TableHead className="whitespace-nowrap">
                        Vai trò
                      </TableHead>
                      <TableHead className="whitespace-nowrap">
                        Nhân viên liên kết
                      </TableHead>

                      <TableHead className="whitespace-nowrap">
                        Trạng thái
                      </TableHead>
                      <TableHead className="text-center">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          Đang tải...
                        </TableCell>
                      </TableRow>
                    ) : filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="text-center py-8 text-muted-foreground"
                        >
                          Không tìm thấy tài khoản nào
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedUsers.map((user, index) => (
                        <TableRow
                          key={user.id}
                          className="hover:bg-muted/50 transition-colors border-border"
                        >
                          <TableCell className="text-center text-muted-foreground font-medium whitespace-nowrap">
                            {globalOffset + index + 1}
                          </TableCell>
                          <TableCell className="font-medium whitespace-nowrap">
                            {user.email}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {user.fullName || "—"}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {user.role && typeof user.role === "object"
                              ? user.role.name
                              : user.role || "—"}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {user.employee ? (
                              <div className="flex flex-col">
                                <span className="text-sm font-medium">
                                  {user.employee.fullName}
                                </span>
                                <span className="text-xs text-muted-foreground font-mono italic">
                                  {user.employee.employeeCode}
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground italic">
                                Chưa liên kết
                              </span>
                            )}
                          </TableCell>

                          <TableCell className="whitespace-nowrap">
                            {user.status === "ACTIVE" ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                Đang hoạt động
                              </span>
                            ) : user.status === "INACTIVE" ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                                Đang khoá
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                                Bị cấm
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-center whitespace-nowrap">
                            <div className="flex justify-center gap-3">
                              <PermissionGuard
                                permissions={[Permission.USER_UPDATE]}
                              >
                                  <button
                                    onClick={() => handleToggleStatus(user)}
                                    disabled={isProcessing}
                                    className={cn(
                                      "transition-colors",
                                      isProcessing && "opacity-50 cursor-not-allowed",
                                      user.status === "ACTIVE"
                                        ? "text-slate-400 hover:text-amber-500"
                                        : "text-slate-400 hover:text-green-500",
                                    )}
                                    title={
                                      user.status === "ACTIVE"
                                        ? "Khoá tài khoản"
                                        : "Mở khoá tài khoản"
                                    }
                                  >
                                    {isProcessing && pendingAction?.id === user.id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : user.status === "ACTIVE" ? (
                                      <Lock className="h-4 w-4" />
                                    ) : (
                                      <Unlock className="h-4 w-4" />
                                    )}
                                  </button>
                                <button
                                  onClick={() => handleEdit(user)}
                                  className="text-slate-400 hover:text-blue-500 transition-colors"
                                  title="Chỉnh sửa"
                                >
                                  <Pencil className="h-4 w-4" />
                                </button>
                              </PermissionGuard>
                              <PermissionGuard
                                permissions={[Permission.USER_DELETE]}
                              >
                                <button
                                  onClick={() => handleDelete(user)}
                                  disabled={isProcessing}
                                  className={cn(
                                    "text-slate-400 hover:text-destructive transition-colors",
                                    isProcessing && "opacity-50 cursor-not-allowed",
                                  )}
                                  title="Xóa tài khoản"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </PermissionGuard>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredUsers.length}
              onPageChange={setCurrentPage}
            />
          </Card>

          <Dialog
            open={isDialogOpen}
            onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) resetForm();
            }}
          >
            <DialogContent className="sm:max-w-125">
              <DialogHeader>
                <DialogTitle>
                  {isEditMode ? "Chỉnh sửa tài khoản" : "Thêm tài khoản mới"}
                </DialogTitle>
                <DialogDescription>
                  Nhập thông tin chi tiết cho tài khoản hệ thống.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">
                    Email <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="VD: admin@example.com"
                    className={inputErrorClass(formErrors.email)}
                  />
                  {formErrors.email && (
                    <p className="text-xs text-destructive">
                      {formErrors.email}
                    </p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="fullName">
                    Họ và tên <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) =>
                      setFormData({ ...formData, fullName: e.target.value })
                    }
                    placeholder="VD: Nguyễn Văn A"
                    className={inputErrorClass(formErrors.fullName)}
                  />
                  {formErrors.fullName && (
                    <p className="text-xs text-destructive">
                      {formErrors.fullName}
                    </p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">
                    Mật khẩu{" "}
                    {!isEditMode && <span className="text-destructive">*</span>}
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    placeholder={
                      isEditMode
                        ? "Để trống nếu không muốn đổi"
                        : "Nhập mật khẩu..."
                    }
                    className={inputErrorClass(formErrors.password)}
                  />
                  {formErrors.password && (
                    <p className="text-xs text-destructive">
                      {formErrors.password}
                    </p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="roleId">
                    Vai trò <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.roleId}
                    onValueChange={(val) =>
                      setFormData({ ...formData, roleId: val })
                    }
                  >
                    <SelectTrigger
                      className={inputErrorClass(formErrors.roleId)}
                    >
                      <SelectValue placeholder="Chọn vai trò" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.id} value={role.id.toString()}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formErrors.roleId && (
                    <p className="text-xs text-destructive">
                      {formErrors.roleId}
                    </p>
                  )}
                </div>
                {isEditMode && (
                  <div className="grid gap-2">
                    <Label htmlFor="status">Trạng thái</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(val) =>
                        setFormData({ ...formData, status: val })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn trạng thái" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ACTIVE">Hoạt động</SelectItem>
                        <SelectItem value="INACTIVE">Đã khoá</SelectItem>
                        <SelectItem value="BANNED">Bị cấm</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Hủy
                </Button>
                <Button onClick={handleSubmit} disabled={isSaving}>
                  {isSaving && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {isEditMode ? "Cập nhật" : "Lưu tài khoản"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <ConfirmDialog
            isOpen={confirmState.isOpen}
            onClose={() =>
              setConfirmState((prev) => ({ ...prev, isOpen: false }))
            }
            onConfirm={confirmState.onConfirm}
            title={confirmState.title}
            description={confirmState.description}
            isDanger={confirmState.isDanger}
          />

          <ApprovalReasonDialog
            open={isApprovalDialogOpen}
            onOpenChange={(open) => {
              setIsApprovalDialogOpen(open);
              if (!open) setPendingAction(null);
            }}
            onConfirm={handleConfirmApproval}
            actionTitle={
              pendingAction?.type === "update"
                ? "Cập nhật tài khoản"
                : pendingAction?.type === "delete"
                  ? "Xóa tài khoản"
                  : "Thay đổi trạng thái tài khoản"
            }
          />
        </CardContent>
      </Card>
    </PermissionGuard>
  );
}
