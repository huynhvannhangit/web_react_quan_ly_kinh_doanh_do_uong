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
import { Shield, User as UserIcon } from "lucide-react";
import { UserRoleDialog } from "./user-role-dialog";
import { toast } from "sonner";
import { Role } from "@/services/role.service";

export function UserList() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

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

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Danh sách người dùng</h2>
      </div>

      <div className="border rounded-lg">
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
            {users.length === 0 && !isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-8 text-muted-foreground"
                >
                  Chưa có người dùng nào
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.email}</TableCell>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <UserIcon className="w-4 h-4 text-muted-foreground" />
                      {user.fullName}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Shield className="w-3 h-3 text-primary" />
                      {getRoleName(user)}
                    </div>
                  </TableCell>
                  <TableCell>
                    {user.employee ? (
                      <span className="text-sm">
                        <span className="font-mono text-xs text-blue-600 mr-1">
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
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
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

      <UserRoleDialog
        open={openDialog}
        onOpenChange={setOpenDialog}
        user={selectedUser}
        onSuccess={fetchUsers}
      />
    </div>
  );
}
