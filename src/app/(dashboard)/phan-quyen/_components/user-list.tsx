// cspell:disable
"use client";

import { useEffect, useState } from "react";
import { User, userService } from "@/services/user.service";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

import { Search, RotateCcw } from "lucide-react";
import { UserRoleDialog } from "./user-role-dialog";
import { toast } from "sonner";
import { Role } from "@/services/role.service";

export function UserList() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [searchName, setSearchName] = useState("");

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const data = await userService.getAll();
      console.log("fetchUsers response:", data);

      // Nếu data được bọc trong cấu trúc { data: [...] } (từ TransformInterceptor)
      const apiResponse = data as unknown as { data?: User[] };
      if (
        apiResponse &&
        typeof apiResponse === "object" &&
        Array.isArray(apiResponse.data)
      ) {
        setUsers(apiResponse.data);
      } else if (Array.isArray(data)) {
        setUsers(data);
      } else {
        console.error("fetchUsers trả về định dạng không mong muốn:", data);
        setUsers([]);
      }
    } catch (error) {
      console.error("fetchUsers error:", error);
      toast.error("Không thể tải danh sách người dùng");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleEditRole = (user: User) => {
    setSelectedUser(user);
    setOpenDialog(true);
  };

  const getRoleName = (user: User) => {
    if (!user.role)
      return (
        <span className="text-muted-foreground italic">Chưa phân quyền</span>
      );
    if (typeof user.role === "string") return user.role;
    return (user.role as Role).name;
  };

  const handleSearch = () => {
    setSearchName(searchInput);
  };

  const handleReset = () => {
    setSearchInput("");
    setSearchName("");
  };

  const filteredUsers = users.filter((user) => {
    if (!searchName) return true;
    const q = searchName.toLowerCase();
    return (
      user.email.toLowerCase().includes(q) ||
      (user.fullName ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground uppercase">
            Phân quyền Người dùng
          </h2>
        </div>

        <div className="flex flex-wrap items-end justify-between w-full gap-4">
          {/* Left Spacer */}
          <div className="hidden lg:block lg:flex-1" />

          {/* Center: Search Input */}
          <div className="flex flex-col gap-1 w-full max-w-150">
            <label className="text-xs text-muted-foreground text-left">
              Email / Họ tên
            </label>
            <Input
              placeholder="Tìm kiếm người dùng..."
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
          </div>
        </div>

        <div>
          <h3 className="text-base font-semibold mb-3">Danh sách người dùng</h3>
          <div className="[&_th]:bg-muted [&_th]:text-muted-foreground [&_th]:font-semibold [&_td]:py-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Họ tên</TableHead>
                  <TableHead>Vai trò hiện tại</TableHead>
                  <TableHead>Nhân viên liên kết</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      Đang tải...
                    </TableCell>
                  </TableRow>
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-8 text-muted-foreground"
                    >
                      {searchName
                        ? "Không tìm thấy người dùng phù hợp"
                        : "Chưa có người dùng nào"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.email}</TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {user.fullName}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getRoleName(user)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {user.employee ? (
                          <span className="text-sm">
                            <span className="font-mono text-xs text-blue-500 mr-1">
                              {user.employee.employeeCode}
                            </span>
                            {user.employee.fullName}
                          </span>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-xs text-muted-foreground"
                          >
                            Chưa liên kết
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            user.status === "ACTIVE"
                              ? "bg-green-500/10 text-green-600 dark:text-green-400"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {user.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditRole(user)}
                        >
                          Phân quyền
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      <UserRoleDialog
        open={openDialog}
        onOpenChange={setOpenDialog}
        user={selectedUser}
        onSuccess={fetchUsers}
      />
    </>
  );
}
