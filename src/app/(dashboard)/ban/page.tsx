"use client";

import React, { useEffect, useState } from "react";
import {
  tableService,
  Table as TableType,
  TableStatus,
} from "@/services/table.service";
import { areaService, Area } from "@/services/area.service";
import { Trash2, Plus, Pencil, Search, RotateCcw } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/shared/Pagination";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Permission } from "@/types";
import { PermissionGuard } from "@/components/shared/PermissionGuard";
import {
  collectErrors,
  required,
  noSpecialChars,
  positiveNumber,
  minValue,
  isInteger,
  inputErrorClass,
} from "@/lib/validators";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";

export default function TablePage() {
  const [tables, setTables] = useState<TableType[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newTable, setNewTable] = useState({
    tableNumber: "",
    capacity: 4,
    areaId: "",
    status: TableStatus.AVAILABLE,
  });
  const [editingTable, setEditingTable] = useState<TableType | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isDeletingBulk, setIsDeletingBulk] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

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

  const totalPages = Math.max(1, Math.ceil(tables.length / pageSize));
  const paginatedTables = tables.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  const globalOffset = (currentPage - 1) * pageSize;

  useEffect(() => {
    void loadData();
  }, []);

  const loadData = async (keyword?: string) => {
    setIsLoading(true);
    setSelectedIds([]);
    try {
      const [tableData, areaData] = await Promise.all([
        tableService.getAll(keyword),
        areaService.getAll(),
      ]);
      setTables(tableData);
      setAreas(areaData);
    } catch (error) {
      console.error("Failed to load table data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setNewTable({
      tableNumber: "",
      capacity: 4,
      areaId: "",
      status: TableStatus.AVAILABLE,
    });
    setEditingTable(null);
    setIsEditMode(false);
    setFormErrors({});
    setApiError(null);
  };

  const handleEdit = async (table: TableType) => {
    try {
      const freshData = await tableService.getOne(table.id);
      setEditingTable(freshData);
      setIsEditMode(true);
      setNewTable({
        tableNumber: freshData.tableNumber,
        capacity: freshData.capacity,
        areaId: freshData.areaId ? freshData.areaId.toString() : "",
        status: freshData.status,
      });
      setIsDialogOpen(true);
    } catch (error) {
      console.error("Failed to load table details:", error);
    }
  };

  const handleDelete = async (id: number, tableNumber: string) => {
    setConfirmState({
      isOpen: true,
      title: "Xác nhận xóa bàn",
      description: `Bạn có chắc muốn xóa bàn "${tableNumber}"?`,
      isDanger: true,
      onConfirm: async () => {
        try {
          await tableService.delete(id);
          toast.success("Xóa bàn thành công");
          loadData();
        } catch (error) {
          console.error("Failed to delete table:", error);
          toast.error("Xóa bàn thất bại!");
        } finally {
          setConfirmState((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(tables.map((t) => t.id));
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
      description: `Bạn có chắc muốn xóa ${selectedIds.length} bàn đã chọn?`,
      isDanger: true,
      onConfirm: async () => {
        setIsDeletingBulk(true);
        try {
          await tableService.deleteMany(selectedIds);
          setSelectedIds([]);
          toast.success("Xóa hàng loạt thành công");
          loadData();
        } catch (error) {
          console.error("Failed to bulk delete tables:", error);
          toast.error("Xóa hàng loạt thất bại!");
        } finally {
          setIsDeletingBulk(false);
          setConfirmState((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const handleCreateTable = async () => {
    const errors = collectErrors({
      tableNumber:
        required(newTable.tableNumber) || noSpecialChars(newTable.tableNumber),
      capacity:
        isInteger(newTable.capacity) ||
        minValue(newTable.capacity, 1) ||
        positiveNumber(newTable.capacity),
      areaId: required(newTable.areaId),
    });
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});
    setApiError(null);
    setIsSaving(true);
    try {
      const payload = {
        tableNumber: newTable.tableNumber.trim(),
        areaId: parseInt(newTable.areaId),
        capacity: Number(newTable.capacity),
        status: newTable.status,
      };
      if (isEditMode && editingTable) {
        await tableService.update(editingTable.id, payload);
      } else {
        await tableService.create(payload);
      }
      resetForm();
      setIsDialogOpen(false);
      loadData();
    } catch (error) {
      console.error("Failed to save table:", error);
      const msg =
        (error as { customMessage?: string }).customMessage ||
        (error instanceof Error ? error.message : "Lưu bàn thất bại!");
      if (msg === "Tên bàn đã tồn tại" || msg === "Số bàn đã tồn tại") {
        setFormErrors({ tableNumber: msg });
      } else {
        setApiError(msg);
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <PermissionGuard
      permissions={[Permission.TABLE_VIEW]}
      redirect="/dashboard"
    >
      <Card>
        <CardContent className="p-8 space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold tracking-wide text-[#00509E] dark:text-blue-400 uppercase">
              Quản lý Bàn
            </h1>
          </div>

          <div className="flex flex-wrap items-end justify-between mt-6 w-full gap-4">
            <div className="hidden lg:block lg:flex-1" />

            <div className="flex flex-col gap-1 w-full max-w-150">
              <label className="text-xs text-muted-foreground text-left">
                Tên bàn
              </label>
              <Input
                placeholder="Tìm kiếm..."
                className="bg-background border-border rounded-lg h-10 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex-1 flex justify-end items-end gap-2 mb-0.5 min-w-fit">
              <Button
                onClick={() => void loadData(searchTerm)}
                className="gap-2 bg-[#00509E] hover:bg-[#00509E]/90 text-white rounded-lg"
              >
                <Search className="h-4 w-4" />
                Tìm kiếm
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  void loadData();
                }}
                className="gap-2 rounded-lg"
              >
                <RotateCcw className="h-4 w-4" />
                Làm mới
              </Button>

              <Dialog
                open={isDialogOpen}
                onOpenChange={(open) => {
                  setIsDialogOpen(open);
                  if (!open) resetForm();
                }}
              >
                <DialogTrigger asChild>
                  <Button className="bg-[#00509E] hover:bg-[#00509E]/90 text-white rounded-lg">
                    <Plus className="mr-2 h-4 w-4" /> Thêm
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {isEditMode ? "Chỉnh sửa bàn" : "Thêm bàn mới"}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    {apiError && (
                      <div className="rounded-md bg-destructive/10 border border-destructive/30 px-3 py-2 text-sm text-destructive">
                        {apiError}
                      </div>
                    )}
                    <div className="grid gap-2">
                      <Label htmlFor="tableNumber">
                        Tên bàn <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="tableNumber"
                        value={newTable.tableNumber}
                        onChange={(e) => {
                          setNewTable({
                            ...newTable,
                            tableNumber: e.target.value,
                          });
                          if (formErrors.tableNumber)
                            setFormErrors((p) => ({ ...p, tableNumber: "" }));
                        }}
                        placeholder="VD: Bàn 1, Bàn 2..."
                        className={inputErrorClass(formErrors.tableNumber)}
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
                      {formErrors.tableNumber && (
                        <p className="text-xs text-destructive mt-1">
                          {formErrors.tableNumber}
                        </p>
                      )}
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="areaId">
                        Khu vực <span className="text-destructive">*</span>
                      </Label>
                      <Select
                        value={newTable.areaId}
                        onValueChange={(val) =>
                          setNewTable({ ...newTable, areaId: val })
                        }
                      >
                        <SelectTrigger id="areaId">
                          <SelectValue placeholder="Chọn khu vực" />
                        </SelectTrigger>
                        <SelectContent>
                          {areas.map((area) => (
                            <SelectItem
                              key={area.id}
                              value={area.id.toString()}
                            >
                              {area.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {formErrors.areaId && (
                        <p className="text-xs text-destructive mt-1">
                          {formErrors.areaId}
                        </p>
                      )}
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="status">Trạng thái</Label>
                      <Select
                        value={newTable.status}
                        onValueChange={(val: TableStatus) =>
                          setNewTable({ ...newTable, status: val })
                        }
                      >
                        <SelectTrigger id="status">
                          <SelectValue placeholder="Chọn trạng thái" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="AVAILABLE">Trống</SelectItem>
                          <SelectItem value="OCCUPIED">Có khách</SelectItem>
                          <SelectItem value="RESERVED">Đã đặt</SelectItem>
                          <SelectItem value="MAINTENANCE">Bảo trì</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="capacity">
                        Số chỗ ngồi <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="capacity"
                        type="number"
                        min="1"
                        value={newTable.capacity}
                        onChange={(e) => {
                          setNewTable({
                            ...newTable,
                            capacity: parseInt(e.target.value) || 0,
                          });
                          if (formErrors.capacity)
                            setFormErrors((p) => ({ ...p, capacity: "" }));
                        }}
                        placeholder="VD: 4, 6, 8..."
                        className={inputErrorClass(formErrors.capacity)}
                        required
                      />
                      {formErrors.capacity && (
                        <p className="text-xs text-destructive mt-1">
                          {formErrors.capacity}
                        </p>
                      )}
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                    >
                      Hủy
                    </Button>
                    <Button onClick={handleCreateTable} disabled={isSaving}>
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
                  Danh sách bàn
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="px-0">
              <div className="overflow-x-auto [&_th]:bg-muted [&_th]:text-muted-foreground [&_th]:font-semibold [&_td]:py-4">
                <Table className="min-w-325 font-sans">
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-border">
                      <TableHead className="w-12 text-center">
                        <Checkbox
                          checked={
                            tables.length > 0 &&
                            selectedIds.length === tables.length
                          }
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead className="w-16 text-center">STT</TableHead>
                      <TableHead>Tên bàn</TableHead>
                      <TableHead>Số chỗ ngồi</TableHead>
                      <TableHead>Khu vực</TableHead>
                      <TableHead>Ngày cập nhật</TableHead>
                      <TableHead>Người cập nhật</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-12">
                          <div className="flex flex-col items-center gap-2 text-muted-foreground">
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                            Đang tải dữ liệu...
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : tables.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={9}
                          className="text-center py-12 text-muted-foreground"
                        >
                          {searchTerm
                            ? "Không tìm thấy bàn phù hợp"
                            : "Chưa có bàn nào"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedTables.map((table, index) => (
                        <TableRow
                          key={table.id}
                          className="hover:bg-muted/50 transition-colors border-border"
                        >
                          <TableCell className="text-center">
                            <Checkbox
                              checked={selectedIds.includes(table.id)}
                              onCheckedChange={(checked) =>
                                handleSelectRow(table.id, !!checked)
                              }
                            />
                          </TableCell>
                          <TableCell className="text-center font-medium text-slate-500">
                            {globalOffset + index + 1}
                          </TableCell>
                          <TableCell className="font-semibold text-foreground whitespace-nowrap">
                            {table.tableNumber}
                          </TableCell>
                          <TableCell className="text-center">
                            {table.capacity}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                            {table.area?.name || "—"}
                          </TableCell>
                          <TableCell className="text-muted-foreground whitespace-nowrap">
                            {new Date(table.updatedAt).toLocaleDateString(
                              "vi-VN",
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground whitespace-nowrap">
                            {table.updater?.fullName || "—"}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <Badge
                              className={
                                table.status === "AVAILABLE"
                                  ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200"
                                  : table.status === "OCCUPIED"
                                    ? "bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200"
                                    : table.status === "RESERVED"
                                      ? "bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200"
                                      : "bg-slate-100 text-slate-700 hover:bg-slate-100 border-slate-200"
                              }
                            >
                              {table.status === "AVAILABLE"
                                ? "Trống"
                                : table.status === "OCCUPIED"
                                  ? "Có khách"
                                  : table.status === "RESERVED"
                                    ? "Đã đặt"
                                    : "Bảo trì"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-2 text-slate-500">
                              <button
                                className="p-2 hover:text-[#00509E] hover:bg-[#00509E]/10 rounded-lg transition-all"
                                onClick={() => handleEdit(table)}
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button
                                className="p-2 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                onClick={() =>
                                  handleDelete(table.id, table.tableNumber)
                                }
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
                totalItems={tables.length}
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
