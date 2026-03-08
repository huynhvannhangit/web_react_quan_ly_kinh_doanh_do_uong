// cspell:disable
"use client";

import React, { useEffect, useState } from "react";
import {
  employeeService,
  Employee,
  AvailableUser,
  EmployeeStatus,
} from "@/services/employee.service";
import { Pagination } from "@/components/shared/Pagination";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Pencil, Trash2, UserCheck, UserMinus } from "lucide-react";
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
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
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
import { Permission } from "@/types";
import { PermissionGuard } from "@/components/shared/PermissionGuard";
import {
  collectErrors,
  required,
  phone,
  cccd,
  positiveNumber,
  noSpecialChars,
  maxLength,
  inputErrorClass,
} from "@/lib/validators";

// Helper arrays
const currentYear = new Date().getFullYear();
const years = Array.from(
  { length: currentYear - 1900 + 1 },
  (_, i) => currentYear - i,
);
const months = Array.from({ length: 12 }, (_, i) => i + 1);

const NO_USER_VALUE = "__none__";

export default function StaffPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<AvailableUser[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [newEmployee, setNewEmployee] = useState({
    fullName: "",
    position: "",
    salary: 0,
    phone: "",
    address: "",
    birthDate: "",
    identityCard: "",
    userId: null as number | null,
    status: EmployeeStatus.WORKING,
  });
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isDeletingBulk, setIsDeletingBulk] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
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
  const pageSize = 20;

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async (keyword?: string) => {
    setIsLoading(true);
    setSelectedIds([]);
    try {
      const data = await employeeService.getAll(keyword);
      setEmployees(data);
    } catch (error) {
      console.error("Failed to load employees:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAvailableUsers = async (excludeEmployeeId?: number) => {
    setIsLoadingUsers(true);
    try {
      const users = await employeeService.getAvailableUsers(excludeEmployeeId);
      setAvailableUsers(users);
    } catch (error) {
      console.error("Failed to load available users:", error);
      setAvailableUsers([]);
    } finally {
      setIsLoadingUsers(false);
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
      userId: null,
      status: EmployeeStatus.WORKING,
    });
    setEditingEmployee(null);
    setIsEditMode(false);
    setAvailableUsers([]);
    setFormErrors({});
    setApiError(null);
  };

  const handleOpenCreateDialog = () => {
    resetForm();
    loadAvailableUsers();
    setIsDialogOpen(true);
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
        userId: freshData.userId ?? null,
        status: freshData.status,
      });
      // Load available users, exclude this employee so its current user still shows
      await loadAvailableUsers(freshData.id);

      // If employee already has a user assigned, add that user to the available list
      // (since it's excluded from the query)
      if (freshData.user) {
        setAvailableUsers((prev) => {
          const alreadyInList = prev.some((u) => u.id === freshData.user!.id);
          if (!alreadyInList) {
            return [
              {
                id: freshData.user!.id,
                email: freshData.user!.email,
                fullName: freshData.user!.fullName,
                status: freshData.user!.status,
              },
              ...prev,
            ];
          }
          return prev;
        });
      }

      setIsDialogOpen(true);
    } catch (error) {
      console.error("Failed to load employee details:", error);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    setConfirmState({
      isOpen: true,
      title: "Xác nhận xóa nhân viên",
      description: `Bạn có chắc muốn xóa nhân viên "${name}"?`,
      isDanger: true,
      onConfirm: async () => {
        try {
          await employeeService.delete(id);
          toast.success("Xóa nhân viên thành công");
          loadEmployees();
        } catch (error) {
          console.error("Failed to delete employee:", error);
          toast.error("Xóa nhân viên thất bại!");
        } finally {
          setConfirmState((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(employees.map((e) => e.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((prevId) => prevId !== id));
    }
  };

  const handleBulkDelete = async () => {
    setConfirmState({
      isOpen: true,
      title: "Xác nhận xóa hàng loạt",
      description: `Bạn có chắc muốn xóa ${selectedIds.length} nhân viên đã chọn?`,
      isDanger: true,
      onConfirm: async () => {
        setIsDeletingBulk(true);
        try {
          await employeeService.deleteMany(selectedIds);
          setSelectedIds([]);
          toast.success("Xóa hàng loạt thành công");
          loadEmployees();
        } catch (error) {
          console.error("Failed to bulk delete employees:", error);
          toast.error("Xóa hàng loạt thất bại!");
        } finally {
          setIsDeletingBulk(false);
          setConfirmState((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const handleToggleEmployeeStatus = async (emp: Employee) => {
    const isCurrentlyWorking = emp.status === EmployeeStatus.WORKING;
    const newStatus = isCurrentlyWorking
      ? EmployeeStatus.RESIGNED
      : EmployeeStatus.WORKING;
    const actionText = isCurrentlyWorking ? "nghỉ việc" : "đi làm lại";

    setConfirmState({
      isOpen: true,
      title: `Xác nhận ${actionText}`,
      description: `Bạn có chắc muốn chuyển trạng thái nhân viên "${emp.fullName}" thành ${actionText}?`,
      isDanger: isCurrentlyWorking,
      onConfirm: async () => {
        try {
          await employeeService.updateEmployeeStatus(emp.id, newStatus);
          toast.success(
            `${isCurrentlyWorking ? "Cập nhật nghỉ việc" : "Cập nhật đi làm lại"} thành công`,
          );
          loadEmployees();
        } catch (error: unknown) {
          console.error(`Failed to update employee status:`, error);
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

  const handleCreateEmployee = async () => {
    // Age check
    let ageError = "";
    if (newEmployee.birthDate) {
      const birthDate = new Date(newEmployee.birthDate);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
      if (age < 18) ageError = "Nhân viên phải từ đủ 18 tuổi.";
    }
    const errors = collectErrors({
      fullName:
        required(newEmployee.fullName) ||
        noSpecialChars(newEmployee.fullName) ||
        maxLength(newEmployee.fullName, 100),
      salary: positiveNumber(newEmployee.salary),
      identityCard: cccd(newEmployee.identityCard),
      phone: phone(newEmployee.phone),
      birthDate: ageError,
      address: maxLength(newEmployee.address, 255),
    });
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});
    setApiError(null);
    setIsSaving(true);
    try {
      const payload: Partial<Parameters<typeof employeeService.create>[0]> & {
        status?: string;
      } = {
        fullName: newEmployee.fullName.trim(),
        position: newEmployee.position?.trim() || undefined,
        phone: newEmployee.phone?.trim() || undefined,
        address: newEmployee.address?.trim() || undefined,
        salary: Number(newEmployee.salary) || 0,
        identityCard: newEmployee.identityCard?.trim() || undefined,
        birthDate: newEmployee.birthDate
          ? format(new Date(newEmployee.birthDate), "yyyy-MM-dd")
          : undefined,
        userId: newEmployee.userId || undefined,
      };

      if (isEditMode) {
        payload.status = newEmployee.status;
      }
      if (isEditMode && editingEmployee) {
        await employeeService.update(
          editingEmployee.id,
          payload as Parameters<typeof employeeService.update>[1],
        );
      } else {
        await employeeService.create(
          payload as Parameters<typeof employeeService.create>[0],
        );
      }
      resetForm();
      setIsDialogOpen(false);
      loadEmployees();
    } catch (error: unknown) {
      console.error("Failed to save employee:", error);
      const msg =
        (error as { customMessage?: string }).customMessage ||
        (error instanceof Error ? error.message : "Lưu nhân viên thất bại!");
      if (msg.includes("18 tuổi")) {
        setFormErrors({ birthDate: msg });
      } else if (msg.includes("Identity Card")) {
        setFormErrors({ identityCard: msg });
      } else {
        setApiError(msg);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const filteredEmployees = employees;
  const totalPages = Math.max(
    1,
    Math.ceil(filteredEmployees.length / pageSize),
  );
  const paginatedEmployees = filteredEmployees.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  const globalOffset = (currentPage - 1) * pageSize;

  const handleSearch = () => {
    setCurrentPage(1);
    void loadEmployees(searchTerm);
  };
  const handleReset = () => {
    setSearchTerm("");
    setCurrentPage(1);
    void loadEmployees();
  };

  return (
    <PermissionGuard
      permissions={[Permission.EMPLOYEE_VIEW]}
      redirect="/dashboard"
    >
      <Card>
        <CardContent className="p-8 space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold tracking-wide text-[#00509E] dark:text-blue-400 uppercase">
              Quản lý Nhân viên
            </h1>
          </div>
          {/* Filter & Stats row */}
          {/* Filter row */}
          <div className="flex flex-wrap items-end justify-between mt-6 w-full gap-4">
            {/* Left side empty or stats can go here if needed, currently using flex-1 to push search to center if space allows */}
            <div className="hidden lg:block lg:flex-1" />

            {/* Center: Search Input (Max-width 600px) */}
            <div className="flex flex-col gap-1 w-full max-w-150">
              <label className="text-xs text-muted-foreground text-left">
                Họ tên / SĐT
              </label>
              <Input
                placeholder="Tìm kiếm..."
                className="bg-background border-border rounded-lg h-10 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSearch();
                  }
                }}
              />
            </div>

            {/* Right: Action Buttons */}
            <div className="flex-1 flex justify-end items-end gap-2 mb-0.5 min-w-fit">
              <Button
                onClick={handleSearch}
                className="gap-2 bg-[#00509E] hover:bg-[#00509E]/90 text-white rounded-lg"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
                Tìm kiếm
              </Button>
              <Button
                variant="outline"
                onClick={handleReset}
                className="gap-2 rounded-lg"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                  <path d="M3 3v5h5" />
                </svg>
                Làm mới
              </Button>
              <Dialog
                open={isDialogOpen}
                onOpenChange={(open) => {
                  if (open) {
                    handleOpenCreateDialog();
                  } else {
                    setIsDialogOpen(false);
                    resetForm();
                  }
                }}
              >
                <DialogTrigger asChild>
                  <Button className="bg-[#00509E] hover:bg-[#00509E]/90 text-white rounded-lg">
                    <Plus className="mr-2 h-4 w-4" /> Thêm
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>
                      {isEditMode
                        ? "Chỉnh sửa nhân viên"
                        : "Thêm nhân viên mới"}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    {apiError && (
                      <div className="rounded-md bg-destructive/10 border border-destructive/30 px-3 py-2 text-sm text-destructive">
                        {apiError}
                      </div>
                    )}
                    <div className="grid gap-2">
                      <Label htmlFor="fullName">
                        Họ và tên <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="fullName"
                        value={newEmployee.fullName}
                        onChange={(e) => {
                          setNewEmployee({
                            ...newEmployee,
                            fullName: e.target.value,
                          });
                          if (formErrors.fullName)
                            setFormErrors((p) => ({ ...p, fullName: "" }));
                        }}
                        placeholder="VD: Nguyễn Văn A"
                        className={inputErrorClass(formErrors.fullName)}
                        required
                        onInvalid={(e) =>
                          (e.target as HTMLInputElement).setCustomValidity(
                            "Vui lòng điền vào trường này",
                          )
                        }
                        onInput={(e) =>
                          (e.target as HTMLInputElement).setCustomValidity("")
                        }
                      />
                      {formErrors.fullName && (
                        <p className="text-xs text-destructive mt-1">
                          {formErrors.fullName}
                        </p>
                      )}
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
                          onChange={(e) => {
                            setNewEmployee({
                              ...newEmployee,
                              salary: parseNumber(e.target.value),
                            });
                            if (formErrors.salary)
                              setFormErrors((p) => ({ ...p, salary: "" }));
                          }}
                          placeholder="VD: 10.000.000"
                          className={inputErrorClass(formErrors.salary)}
                        />
                        {formErrors.salary && (
                          <p className="text-xs text-destructive mt-1">
                            {formErrors.salary}
                          </p>
                        )}
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
                                !newEmployee.birthDate &&
                                  "text-muted-foreground",
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
                                        new Date(
                                          newEmployee.birthDate,
                                        ).getMonth() + 1
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
                        {formErrors.birthDate && (
                          <p className="text-xs text-destructive mt-1">
                            {formErrors.birthDate}
                          </p>
                        )}
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
                              if (formErrors.identityCard)
                                setFormErrors((p) => ({
                                  ...p,
                                  identityCard: "",
                                }));
                            }
                          }}
                          placeholder="Nhập 12 số CCCD"
                          className={inputErrorClass(formErrors.identityCard)}
                        />
                        {formErrors.identityCard && (
                          <p className="text-xs text-destructive mt-1">
                            {formErrors.identityCard}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="phone">Số điện thoại</Label>
                      <Input
                        id="phone"
                        value={newEmployee.phone}
                        onChange={(e) => {
                          setNewEmployee({
                            ...newEmployee,
                            phone: e.target.value,
                          });
                          if (formErrors.phone)
                            setFormErrors((p) => ({ ...p, phone: "" }));
                        }}
                        placeholder="VD: 0912345678"
                        className={inputErrorClass(formErrors.phone)}
                      />
                      {formErrors.phone && (
                        <p className="text-xs text-destructive mt-1">
                          {formErrors.phone}
                        </p>
                      )}
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="address">Địa chỉ</Label>
                      <Input
                        id="address"
                        value={newEmployee.address}
                        onChange={(e) =>
                          setNewEmployee({
                            ...newEmployee,
                            address: e.target.value,
                          })
                        }
                      />
                    </div>

                    {/* Tài khoản hệ thống */}
                    <div className="grid gap-2">
                      <Label htmlFor="userId">Tài khoản hệ thống</Label>
                      <Select
                        value={
                          newEmployee.userId !== null
                            ? newEmployee.userId.toString()
                            : NO_USER_VALUE
                        }
                        onValueChange={(val) => {
                          setNewEmployee({
                            ...newEmployee,
                            userId: val === NO_USER_VALUE ? null : Number(val),
                          });
                        }}
                        disabled={isLoadingUsers}
                      >
                        <SelectTrigger id="userId">
                          <SelectValue
                            placeholder={
                              isLoadingUsers
                                ? "Đang tải..."
                                : "Chọn tài khoản (tùy chọn)"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={NO_USER_VALUE}>
                            — Không liên kết —
                          </SelectItem>
                          {availableUsers.map((u) => (
                            <SelectItem key={u.id} value={u.id.toString()}>
                              {u.email}
                              {u.fullName ? ` (${u.fullName})` : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                    >
                      Hủy
                    </Button>
                    <Button onClick={handleCreateEmployee} disabled={isSaving}>
                      {isSaving
                        ? "Đang lưu..."
                        : isEditMode
                          ? "Cập nhật"
                          : "Lưu"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <Card className="border-none shadow-none">
            <CardHeader className="flex flex-row items-center justify-between pb-4 px-0">
              <div className="flex items-center gap-4">
                {selectedIds.length > 0 && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleBulkDelete}
                    disabled={isDeletingBulk}
                    className="flex items-center gap-2 rounded-lg"
                  >
                    <Trash2 className="h-4 w-4" />
                    Xóa {selectedIds.length} mục
                  </Button>
                )}
                <CardTitle className="text-lg font-semibold text-foreground">
                  Danh sách nhân viên
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="px-0">
              <div className="overflow-x-auto [&_th]:bg-muted [&_th]:text-muted-foreground [&_th]:font-semibold [&_td]:py-4">
                <Table className="min-w-325 font-sans">
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-border">
                      <TableHead className="w-10 text-center">
                        <Checkbox
                          checked={
                            employees.length > 0 &&
                            selectedIds.length === employees.length
                          }
                          onCheckedChange={handleSelectAll}
                          aria-label="Select all"
                        />
                      </TableHead>
                      <TableHead className="w-14 text-center whitespace-nowrap">
                        STT
                      </TableHead>
                      <TableHead className="whitespace-nowrap">
                        <span className="inline-flex items-center gap-1">
                          Mã NV
                        </span>
                      </TableHead>
                      <TableHead className="min-w-37.5 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1">
                          Họ tên
                        </span>
                      </TableHead>
                      <TableHead className="whitespace-nowrap">
                        <span className="inline-flex items-center gap-1">
                          Ngày sinh
                        </span>
                      </TableHead>
                      <TableHead className="whitespace-nowrap">
                        <span className="inline-flex items-center gap-1">
                          CCCD
                        </span>
                      </TableHead>
                      <TableHead className="whitespace-nowrap">
                        <span className="inline-flex items-center gap-1">
                          Chức vụ
                        </span>
                      </TableHead>
                      <TableHead className="whitespace-nowrap">
                        <span className="inline-flex items-center gap-1">
                          Lương
                        </span>
                      </TableHead>
                      <TableHead className="whitespace-nowrap">
                        <span className="inline-flex items-center gap-1">
                          SĐT
                        </span>
                      </TableHead>
                      <TableHead className="whitespace-nowrap">
                        <span className="inline-flex items-center gap-1">
                          Ngày cập nhật
                        </span>
                      </TableHead>
                      <TableHead className="whitespace-nowrap">
                        <span className="inline-flex items-center gap-1">
                          Người cập nhật
                        </span>
                      </TableHead>
                      <TableHead className="whitespace-nowrap">
                        <span className="inline-flex items-center gap-1">
                          Trạng thái
                        </span>
                      </TableHead>
                      <TableHead className="text-right whitespace-nowrap">
                        Thao tác
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={13} className="text-center py-8">
                          Đang tải...
                        </TableCell>
                      </TableRow>
                    ) : employees.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={13}
                          className="text-center py-8 text-muted-foreground"
                        >
                          Chưa có nhân viên nào
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedEmployees.map((emp, index) => (
                        <TableRow
                          key={emp.id}
                          className="hover:bg-muted/50 transition-all duration-300 border-border"
                          data-state={
                            selectedIds.includes(emp.id)
                              ? "selected"
                              : undefined
                          }
                        >
                          <TableCell className="text-center">
                            <Checkbox
                              checked={selectedIds.includes(emp.id)}
                              onCheckedChange={(checked) =>
                                handleSelectRow(emp.id, !!checked)
                              }
                              aria-label={`Select row ${emp.id}`}
                            />
                          </TableCell>
                          <TableCell className="text-center font-medium text-muted-foreground">
                            {globalOffset + index + 1}
                          </TableCell>

                          <TableCell className="font-medium text-blue-600 dark:text-blue-400 font-mono text-xs">
                            {emp.employeeCode}
                          </TableCell>
                          <TableCell className="font-medium text-foreground min-w-37.5 whitespace-nowrap">
                            {emp.fullName}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {emp.birthDate
                              ? new Date(emp.birthDate).toLocaleDateString(
                                  "vi-VN",
                                )
                              : "—"}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {emp.identityCard || "—"}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {emp.position || "—"}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {new Intl.NumberFormat("vi-VN", {
                              style: "currency",
                              currency: "VND",
                            }).format(emp.salary)}
                          </TableCell>
                          <TableCell className="text-muted-foreground whitespace-nowrap">
                            {emp.phone || "—"}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                            {new Date(emp.updatedAt).toLocaleDateString(
                              "vi-VN",
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                            {emp.user?.fullName || "—"}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {emp.status === EmployeeStatus.WORKING ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                Đang làm việc
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400">
                                Đã nghỉ việc
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-3 text-slate-600">
                              <button
                                className={cn(
                                  "transition-colors",
                                  emp.status === EmployeeStatus.WORKING
                                    ? "text-slate-400 hover:text-red-500"
                                    : "text-slate-400 hover:text-green-500",
                                )}
                                onClick={() => handleToggleEmployeeStatus(emp)}
                                title={
                                  emp.status === EmployeeStatus.WORKING
                                    ? "Đánh dấu nghỉ việc"
                                    : "Đánh dấu đi làm lại"
                                }
                              >
                                {emp.status === EmployeeStatus.WORKING ? (
                                  <UserMinus className="h-4 w-4" />
                                ) : (
                                  <UserCheck className="h-4 w-4" />
                                )}
                              </button>
                              <button
                                className="hover:text-slate-900 transition-colors"
                                onClick={() => handleEdit(emp)}
                                title="Chỉnh sửa"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button
                                className="text-red-500 hover:text-red-600 transition-colors"
                                onClick={() =>
                                  handleDelete(emp.id, emp.fullName)
                                }
                                title="Xóa"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={employees.length}
                onPageChange={setCurrentPage}
              />
            </CardContent>
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
            isLoading={isDeletingBulk}
          />
        </CardContent>
      </Card>
    </PermissionGuard>
  );
}
