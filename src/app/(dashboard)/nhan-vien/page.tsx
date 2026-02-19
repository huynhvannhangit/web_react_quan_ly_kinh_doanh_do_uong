"use client";

import React, { useEffect, useState } from "react";
import { employeeService, Employee } from "@/services/employee.service";
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
import { Plus, Pencil, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn, formatNumber, parseNumber } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Helper arrays
const currentYear = new Date().getFullYear();
const years = Array.from(
  { length: currentYear - 1900 + 1 },
  (_, i) => currentYear - i,
);
const months = Array.from({ length: 12 }, (_, i) => i + 1);

export default function StaffPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newEmployee, setNewEmployee] = useState({
    fullName: "",
    position: "",
    salary: 0,
    phone: "",
    address: "",
    birthDate: "",
    identityCard: "",
  });
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      const data = await employeeService.getAll();
      setEmployees(data);
    } catch (error) {
      console.error("Failed to load employees:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setNewEmployee({
      fullName: "",
      position: "",
      salary: 0,
      phone: "",
      address: "",
      birthDate: "",
      identityCard: "",
    });
    setEditingEmployee(null);
    setIsEditMode(false);
  };

  const handleEdit = async (employee: Employee) => {
    try {
      const freshData = await employeeService.getById(employee.id);
      setEditingEmployee(freshData);
      setIsEditMode(true);
      setNewEmployee({
        fullName: freshData.fullName,
        position: freshData.position || "",
        salary: freshData.salary,
        phone: freshData.phone || "",
        address: freshData.address || "",
        birthDate: freshData.birthDate || "",
        identityCard: freshData.identityCard || "",
      });
      setIsDialogOpen(true);
    } catch (error) {
      console.error("Failed to load employee details:", error);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (confirm(`Bạn có chắc muốn xóa nhân viên "${name}"?`)) {
      try {
        await employeeService.delete(id);
        loadEmployees();
      } catch (error) {
        console.error("Failed to delete employee:", error);
        alert("Xóa nhân viên thất bại!");
      }
    }
  };

  const handleCreateEmployee = async () => {
    try {
      if (newEmployee.salary < 0) {
        alert("Lương không được nhập số âm!");
        return;
      }
      if (newEmployee.identityCard && newEmployee.identityCard.length !== 12) {
        alert("CCCD phải đúng 12 số!");
        return;
      }

      if (newEmployee.birthDate) {
        const birthDate = new Date(newEmployee.birthDate);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        if (age < 18) {
          alert("Nhân viên phải từ đủ 18 tuổi!");
          return;
        }
      }

      const payload = {
        ...newEmployee,
        salary: Number(newEmployee.salary),
        birthDate: newEmployee.birthDate
          ? format(new Date(newEmployee.birthDate), "yyyy-MM-dd")
          : undefined,
      };

      if (isEditMode && editingEmployee) {
        await employeeService.update(editingEmployee.id, payload);
      } else {
        await employeeService.create(payload);
      }
      resetForm();
      setIsDialogOpen(false);
      loadEmployees();
    } catch (error) {
      console.error("Failed to create employee:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Quản lý Nhân viên</h1>
        <Dialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground">
              <Plus className="mr-2 h-4 w-4" /> Thêm nhân viên
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {isEditMode ? "Chỉnh sửa nhân viên" : "Thêm nhân viên mới"}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="fullName">Họ và tên</Label>
                <Input
                  id="fullName"
                  value={newEmployee.fullName}
                  onChange={(e) =>
                    setNewEmployee({
                      ...newEmployee,
                      fullName: e.target.value,
                    })
                  }
                  placeholder="Nhập họ tên nhân viên"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="position">Chức vụ</Label>
                  <Input
                    id="position"
                    value={newEmployee.position}
                    onChange={(e) =>
                      setNewEmployee({
                        ...newEmployee,
                        position: e.target.value,
                      })
                    }
                    placeholder="VD: Phục vụ, Thu ngân..."
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="salary">Lương cơ bản</Label>
                  <Input
                    id="salary"
                    value={formatNumber(newEmployee.salary)}
                    onChange={(e) =>
                      setNewEmployee({
                        ...newEmployee,
                        salary: parseNumber(e.target.value),
                      })
                    }
                    placeholder="VD: 10.000.000"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="birthDate">Ngày sinh</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !newEmployee.birthDate && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {newEmployee.birthDate ? (
                          format(
                            new Date(newEmployee.birthDate),
                            "dd/MM/yyyy",
                            { locale: vi },
                          )
                        ) : (
                          <span>Chọn ngày sinh</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <div className="flex gap-2 p-3 border-b justify-between">
                        <Select
                          value={
                            newEmployee.birthDate
                              ? new Date(newEmployee.birthDate)
                                  .getDate()
                                  .toString()
                              : undefined
                          }
                          onValueChange={(day) => {
                            const current = newEmployee.birthDate
                              ? new Date(newEmployee.birthDate)
                              : new Date();
                            current.setDate(parseInt(day));
                            setNewEmployee({
                              ...newEmployee,
                              birthDate: current.toISOString(),
                            });
                          }}
                        >
                          <SelectTrigger className="w-20">
                            <SelectValue placeholder="Ngày" />
                          </SelectTrigger>
                          <SelectContent className="max-h-50">
                            {(() => {
                              const current = newEmployee.birthDate
                                ? new Date(newEmployee.birthDate)
                                : new Date();
                              const daysInMonth = new Date(
                                current.getFullYear(),
                                current.getMonth() + 1,
                                0,
                              ).getDate();
                              return Array.from(
                                { length: daysInMonth },
                                (_, i) => i + 1,
                              ).map((d) => (
                                <SelectItem key={d} value={d.toString()}>
                                  {d}
                                </SelectItem>
                              ));
                            })()}
                          </SelectContent>
                        </Select>

                        <Select
                          value={
                            newEmployee.birthDate
                              ? (
                                  new Date(newEmployee.birthDate).getMonth() + 1
                                ).toString()
                              : undefined
                          }
                          onValueChange={(month) => {
                            const current = newEmployee.birthDate
                              ? new Date(newEmployee.birthDate)
                              : new Date();
                            current.setMonth(parseInt(month) - 1);
                            setNewEmployee({
                              ...newEmployee,
                              birthDate: current.toISOString(),
                            });
                          }}
                        >
                          <SelectTrigger className="w-28">
                            <SelectValue placeholder="Tháng" />
                          </SelectTrigger>
                          <SelectContent className="max-h-50">
                            {months.map((m) => (
                              <SelectItem key={m} value={m.toString()}>
                                Tháng {m}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Select
                          value={
                            newEmployee.birthDate
                              ? new Date(newEmployee.birthDate)
                                  .getFullYear()
                                  .toString()
                              : undefined
                          }
                          onValueChange={(year) => {
                            const current = newEmployee.birthDate
                              ? new Date(newEmployee.birthDate)
                              : new Date();
                            current.setFullYear(parseInt(year));
                            setNewEmployee({
                              ...newEmployee,
                              birthDate: current.toISOString(),
                            });
                          }}
                        >
                          <SelectTrigger className="w-24">
                            <SelectValue placeholder="Năm" />
                          </SelectTrigger>
                          <SelectContent className="max-h-50">
                            {years.map((y) => (
                              <SelectItem key={y} value={y.toString()}>
                                {y}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Calendar
                        mode="single"
                        selected={
                          newEmployee.birthDate
                            ? new Date(newEmployee.birthDate)
                            : undefined
                        }
                        onSelect={(date) =>
                          setNewEmployee({
                            ...newEmployee,
                            birthDate: date ? date.toISOString() : "",
                          })
                        }
                        month={
                          newEmployee.birthDate
                            ? new Date(newEmployee.birthDate)
                            : undefined
                        }
                        onMonthChange={(date) =>
                          setNewEmployee({
                            ...newEmployee,
                            birthDate: date.toISOString(),
                          })
                        }
                        initialFocus
                        locale={vi}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="identityCard">CCCD (12 số)</Label>
                  <Input
                    id="identityCard"
                    value={newEmployee.identityCard || ""}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "");
                      if (value.length <= 12) {
                        setNewEmployee({
                          ...newEmployee,
                          identityCard: value,
                        });
                      }
                    }}
                    placeholder="Nhập 12 số CCCD"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Số điện thoại</Label>
                <Input
                  id="phone"
                  value={newEmployee.phone}
                  onChange={(e) =>
                    setNewEmployee({ ...newEmployee, phone: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="address">Địa chỉ</Label>
                <Input
                  id="address"
                  value={newEmployee.address}
                  onChange={(e) =>
                    setNewEmployee({ ...newEmployee, address: e.target.value })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Hủy
              </Button>
              <Button
                onClick={handleCreateEmployee}
                disabled={!newEmployee.fullName}
              >
                {isEditMode ? "Cập nhật" : "Lưu"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách nhân viên</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã NV</TableHead>
                <TableHead>Họ tên</TableHead>
                <TableHead>Ngày sinh</TableHead>
                <TableHead>CCCD</TableHead>
                <TableHead>Chức vụ</TableHead>
                <TableHead>Lương</TableHead>
                <TableHead>SĐT</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    Đang tải...
                  </TableCell>
                </TableRow>
              ) : employees.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center py-8 text-muted-foreground"
                  >
                    Chưa có nhân viên nào
                  </TableCell>
                </TableRow>
              ) : (
                employees.map((emp) => (
                  <TableRow key={emp.id}>
                    <TableCell className="font-medium text-blue-600 font-mono text-xs">
                      {emp.employeeCode}
                    </TableCell>
                    <TableCell>{emp.fullName}</TableCell>
                    <TableCell>
                      {emp.birthDate
                        ? new Date(emp.birthDate).toLocaleDateString("vi-VN")
                        : "—"}
                    </TableCell>
                    <TableCell>{emp.identityCard || "—"}</TableCell>
                    <TableCell>{emp.position || "—"}</TableCell>
                    <TableCell>
                      {new Intl.NumberFormat("vi-VN", {
                        style: "currency",
                        currency: "VND",
                      }).format(emp.salary)}
                    </TableCell>
                    <TableCell>{emp.phone || "—"}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="mr-2"
                        onClick={() => handleEdit(emp)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => handleDelete(emp.id, emp.fullName)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
