// cspell:disable
"use client";

import React, { useEffect, useState } from "react";
import { userService, User } from "@/services/user.service";
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
import { Lock, Unlock, Search, RotateCcw } from "lucide-react";
import { Pagination } from "@/components/shared/Pagination";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Permission } from "@/types";
import { PermissionGuard } from "@/components/shared/PermissionGuard";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";

export default function AccountPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
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
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const data = await userService.getAll();
      setUsers(data);
    } catch (error) {
      console.error("Failed to load users:", error);
      toast.error("Không thể tải danh sách tài khoản");
    } finally {
      setIsLoading(false);
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
        try {
          await userService.update(user.id, { status: newStatus });
          toast.success(
            `${isCurrentlyActive ? "Khoá" : "Mở khoá"} tài khoản thành công`,
          );
          loadUsers();
        } catch (error: unknown) {
          console.error(`Failed to ${actionText} account:`, error);
          const msg =
            (error as { response?: { data?: { message?: string } } }).response
              ?.data?.message || `Thao tác thất bại!`;
          toast.error(msg);
        } finally {
          setConfirmState((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const filteredUsers = users.filter(
    (u) =>
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.fullName.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  const globalOffset = (currentPage - 1) * pageSize;

  return (
    <PermissionGuard
      permissions={[Permission.USER_SEARCH]}
      redirect="/dashboard"
    >
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
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    // Search is filtered client-side in the current implementation
                  }
                }}
              />
            </div>

            <div className="flex-1 flex justify-end items-end gap-2 mb-0.5 min-w-fit">
              <Button
                onClick={() => loadUsers()}
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
                onClick={() => setSearchTerm("")}
                className="gap-2 rounded-lg"
              >
                <RotateCcw className="h-4 w-4" />
                Làm mới
              </Button>
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
                            {user.fullName}
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
                            <PermissionGuard
                              permissions={[Permission.USER_MANAGE]}
                            >
                              <div className="flex justify-center gap-3">
                                <button
                                  onClick={() => handleToggleStatus(user)}
                                  className={cn(
                                    "transition-colors",
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
                                  {user.status === "ACTIVE" ? (
                                    <Lock className="h-4 w-4" />
                                  ) : (
                                    <Unlock className="h-4 w-4" />
                                  )}
                                </button>
                              </div>
                            </PermissionGuard>
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
        </CardContent>
      </Card>
    </PermissionGuard>
  );
}
