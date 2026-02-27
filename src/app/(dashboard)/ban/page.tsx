"use client";

import React, { useEffect, useState } from "react";
import {
  tableService,
  Table as TableType,
  TableStatus,
} from "@/services/table.service";
import { areaService, Area } from "@/services/area.service";
import { Trash2, Plus, Pencil } from "lucide-react";
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
  inputErrorClass,
} from "@/lib/validators";

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

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setSelectedIds([]);
    try {
      const [tableData, areaData] = await Promise.all([
        tableService.getAll(),
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
        areaId: freshData.areaId.toString(),
        status: freshData.status,
      });
      setIsDialogOpen(true);
    } catch (error) {
      console.error("Failed to load table details:", error);
    }
  };

  const handleDelete = async (id: number, tableNumber: string) => {
    if (confirm(`Bạn có chắc muốn xóa bàn "${tableNumber}"?`)) {
      try {
        await tableService.delete(id);
        loadData();
      } catch (error) {
        console.error("Failed to delete table:", error);
        alert("Xóa bàn thất bại!");
      }
    }
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
    if (confirm(`Bạn có chắc muốn xóa ${selectedIds.length} bàn đã chọn?`)) {
      setIsDeletingBulk(true);
      try {
        await Promise.all(selectedIds.map((id) => tableService.delete(id)));
        setSelectedIds([]);
        loadData();
      } catch (error) {
        console.error("Failed to bulk delete tables:", error);
        alert("Xóa hàng loạt thất bại!");
      } finally {
        setIsDeletingBulk(false);
      }
    }
  };

  const handleCreateTable = async () => {
    const errors = collectErrors({
      tableNumber:
        required(newTable.tableNumber) || noSpecialChars(newTable.tableNumber),
      capacity: positiveNumber(newTable.capacity),
      areaId: required(newTable.areaId),
    });
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});
    setApiError(null);
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
      const msg = error instanceof Error ? error.message : "Lưu bàn thất bại!";
      setApiError(msg);
    }
  };

  const getStatusBadge = (status: TableStatus) => {
    switch (status) {
      case TableStatus.AVAILABLE:
        return (
          <Badge
            variant="outline"
            className="bg-emerald-50 text-emerald-700 border-emerald-200"
          >
            Trống
          </Badge>
        );
      case TableStatus.OCCUPIED:
        return (
          <Badge
            variant="outline"
            className="bg-rose-50 text-rose-700 border-rose-200"
          >
            Đang ngồi
          </Badge>
        );
      case TableStatus.RESERVED:
        return (
          <Badge
            variant="outline"
            className="bg-amber-50 text-amber-700 border-amber-200"
          >
            Đã đặt
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <PermissionGuard
      permissions={[Permission.TABLE_VIEW]}
      redirect="/dashboard"
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Quản lý Bàn</h1>
          <Dialog
            open={isDialogOpen}
            onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) resetForm();
            }}
          >
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground">
                <Plus className="mr-2 h-4 w-4" /> Thêm bàn
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
                    Số bàn / Tên bàn <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="tableNumber"
                    value={newTable.tableNumber}
                    onChange={(e) => {
                      setNewTable({ ...newTable, tableNumber: e.target.value });
                      if (formErrors.tableNumber)
                        setFormErrors((p) => ({ ...p, tableNumber: "" }));
                    }}
                    placeholder="VD: Bàn 01, VIP 02..."
                    className={inputErrorClass(formErrors.tableNumber)}
                  />
                  {formErrors.tableNumber && (
                    <p className="text-xs text-destructive mt-1">
                      {formErrors.tableNumber}
                    </p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="capacity">
                    Sức chứa (người) <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="capacity"
                    type="number"
                    value={newTable.capacity}
                    onChange={(e) => {
                      setNewTable({
                        ...newTable,
                        capacity: parseInt(e.target.value) || 0,
                      });
                      if (formErrors.capacity)
                        setFormErrors((p) => ({ ...p, capacity: "" }));
                    }}
                    className={inputErrorClass(formErrors.capacity)}
                  />
                  {formErrors.capacity && (
                    <p className="text-xs text-destructive mt-1">
                      {formErrors.capacity}
                    </p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="area">
                    Khu vực <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={newTable.areaId}
                    onValueChange={(value) => {
                      setNewTable({ ...newTable, areaId: value });
                      if (formErrors.areaId)
                        setFormErrors((p) => ({ ...p, areaId: "" }));
                    }}
                  >
                    <SelectTrigger
                      className={inputErrorClass(formErrors.areaId)}
                    >
                      <SelectValue placeholder="Chọn khu vực" />
                    </SelectTrigger>
                    <SelectContent>
                      {areas.map((area) => (
                        <SelectItem key={area.id} value={area.id.toString()}>
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
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Hủy
                </Button>
                <Button onClick={handleCreateTable}>
                  {isEditMode ? "Cập nhật" : "Lưu"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle>Danh sách bàn</CardTitle>
            {selectedIds.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
                disabled={isDeletingBulk}
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Xóa {selectedIds.length} mục
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12.5 text-center">
                    <Checkbox
                      checked={
                        tables.length > 0 &&
                        selectedIds.length === tables.length
                      }
                      onCheckedChange={handleSelectAll}
                      aria-label="Select all"
                    />
                  </TableHead>
                  <TableHead className="w-15 text-center">STT</TableHead>
                  <TableHead>Số bàn</TableHead>
                  <TableHead>Khu vực</TableHead>
                  <TableHead>Sức chứa</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Ngày cập nhật</TableHead>
                  <TableHead>Người cập nhật</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      Đang tải...
                    </TableCell>
                  </TableRow>
                ) : tables.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="text-center py-8 text-muted-foreground"
                    >
                      Chưa có bàn nào
                    </TableCell>
                  </TableRow>
                ) : (
                  tables.map((table, index) => (
                    <TableRow
                      key={table.id}
                      data-state={
                        selectedIds.includes(table.id) ? "selected" : undefined
                      }
                    >
                      <TableCell className="text-center">
                        <Checkbox
                          checked={selectedIds.includes(table.id)}
                          onCheckedChange={(checked) =>
                            handleSelectRow(table.id, !!checked)
                          }
                          aria-label={`Select row ${table.id}`}
                        />
                      </TableCell>
                      <TableCell className="text-center font-medium">
                        {index + 1}
                      </TableCell>
                      <TableCell className="font-medium text-blue-600">
                        {table.tableNumber}
                      </TableCell>
                      <TableCell>
                        {table.area?.name || "Khu vực trống"}
                      </TableCell>
                      <TableCell>{table.capacity} người</TableCell>
                      <TableCell>{getStatusBadge(table.status)}</TableCell>
                      <TableCell>
                        {new Date(table.updatedAt).toLocaleDateString("vi-VN")}
                      </TableCell>
                      <TableCell>
                        {table.updater?.fullName ||
                          table.creator?.fullName ||
                          "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="mr-2"
                          onClick={() => handleEdit(table)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() =>
                            handleDelete(table.id, table.tableNumber)
                          }
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
    </PermissionGuard>
  );
}
