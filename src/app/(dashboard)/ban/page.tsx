"use client";

import React, { useEffect, useState } from "react";
import {
  tableService,
  Table as TableType,
  TableStatus,
} from "@/services/table.service";
import { areaService, Area } from "@/services/area.service";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

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

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
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

  const handleCreateTable = async () => {
    try {
      if (!newTable.areaId) return;
      if (isEditMode && editingTable) {
        await tableService.update(editingTable.id, {
          ...newTable,
          areaId: parseInt(newTable.areaId),
          capacity: Number(newTable.capacity),
        });
      } else {
        await tableService.create({
          ...newTable,
          areaId: parseInt(newTable.areaId),
          capacity: Number(newTable.capacity),
        });
      }
      resetForm();
      setIsDialogOpen(false);
      loadData();
    } catch (error) {
      console.error("Failed to create table:", error);
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
              <div className="grid gap-2">
                <Label htmlFor="tableNumber">Số bàn / Tên bàn</Label>
                <Input
                  id="tableNumber"
                  value={newTable.tableNumber}
                  onChange={(e) =>
                    setNewTable({ ...newTable, tableNumber: e.target.value })
                  }
                  placeholder="VD: Bàn 01, VIP 02..."
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="capacity">Sức chứa (người)</Label>
                <Input
                  id="capacity"
                  type="number"
                  value={newTable.capacity}
                  onChange={(e) =>
                    setNewTable({
                      ...newTable,
                      capacity: parseInt(e.target.value),
                    })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="area">Khu vực</Label>
                <Select
                  value={newTable.areaId}
                  onValueChange={(value) =>
                    setNewTable({ ...newTable, areaId: value })
                  }
                >
                  <SelectTrigger>
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
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Hủy
              </Button>
              <Button
                onClick={handleCreateTable}
                disabled={!newTable.areaId || !newTable.tableNumber}
              >
                {isEditMode ? "Cập nhật" : "Lưu"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách bàn</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Số bàn</TableHead>
                <TableHead>Khu vực</TableHead>
                <TableHead>Sức chứa</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    Đang tải...
                  </TableCell>
                </TableRow>
              ) : tables.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-8 text-muted-foreground"
                  >
                    Chưa có bàn nào
                  </TableCell>
                </TableRow>
              ) : (
                tables.map((table) => (
                  <TableRow key={table.id}>
                    <TableCell className="font-medium text-blue-600">
                      {table.tableNumber}
                    </TableCell>
                    <TableCell>{table.area?.name || "Khu vực trống"}</TableCell>
                    <TableCell>{table.capacity} người</TableCell>
                    <TableCell>{getStatusBadge(table.status)}</TableCell>
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
  );
}
