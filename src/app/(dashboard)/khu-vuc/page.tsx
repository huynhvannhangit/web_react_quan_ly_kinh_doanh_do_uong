"use client";

import React, { useEffect, useState } from "react";
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
import { Permission } from "@/types";
import { PermissionGuard } from "@/components/shared/PermissionGuard";

export default function AreaPage() {
  const [areas, setAreas] = useState<Area[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newArea, setNewArea] = useState({ name: "", description: "" });
  const [editingArea, setEditingArea] = useState<Area | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    loadAreas();
  }, []);

  const loadAreas = async () => {
    try {
      const data = await areaService.getAll();
      setAreas(data);
    } catch (error) {
      console.error("Failed to load areas:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setNewArea({ name: "", description: "" });
    setEditingArea(null);
    setIsEditMode(false);
  };

  const handleEdit = async (area: Area) => {
    try {
      const freshData = await areaService.getOne(area.id);
      setEditingArea(freshData);
      setIsEditMode(true);
      setNewArea({
        name: freshData.name,
        description: freshData.description || "",
      });
      setIsDialogOpen(true);
    } catch (error) {
      console.error("Failed to load area details:", error);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (confirm(`Bạn có chắc muốn xóa khu vực "${name}"?`)) {
      try {
        await areaService.delete(id);
        loadAreas();
      } catch (error) {
        console.error("Failed to delete area:", error);
        alert("Xóa khu vực thất bại!");
      }
    }
  };

  const handleCreateArea = async () => {
    try {
      if (isEditMode && editingArea) {
        await areaService.update(editingArea.id, newArea);
      } else {
        await areaService.create(newArea);
      }
      resetForm();
      setIsDialogOpen(false);
      loadAreas();
    } catch (error) {
      console.error("Failed to create area:", error);
    }
  };

  return (
    <PermissionGuard permissions={[Permission.AREA_VIEW]} redirect="/dashboard">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Quản lý Khu vực</h1>
          <Dialog
            open={isDialogOpen}
            onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) resetForm();
            }}
          >
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground">
                <Plus className="mr-2 h-4 w-4" /> Thêm khu vực
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {isEditMode ? "Chỉnh sửa khu vực" : "Thêm khu vực mới"}
                </DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Tên khu vực</Label>
                  <Input
                    id="name"
                    value={newArea.name}
                    onChange={(e) =>
                      setNewArea({ ...newArea, name: e.target.value })
                    }
                    placeholder="VD: Tầng 1, Sân thượng..."
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Mô tả</Label>
                  <Input
                    id="description"
                    value={newArea.description}
                    onChange={(e) =>
                      setNewArea({ ...newArea, description: e.target.value })
                    }
                    placeholder="Mô tả ngắn gọn về khu vực"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Hủy
                </Button>
                <Button onClick={handleCreateArea}>
                  {isEditMode ? "Cập nhật" : "Lưu"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Danh sách khu vực</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên khu vực</TableHead>
                  <TableHead>Mô tả</TableHead>
                  <TableHead>Ngày cập nhật</TableHead>
                  <TableHead>Người cập nhật</TableHead>
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
                ) : areas.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center py-8 text-muted-foreground"
                    >
                      Chưa có khu vực nào
                    </TableCell>
                  </TableRow>
                ) : (
                  areas.map((area) => (
                    <TableRow key={area.id}>
                      <TableCell className="font-medium">{area.name}</TableCell>
                      <TableCell>{area.description || "—"}</TableCell>
                      <TableCell>
                        {new Date(area.updatedAt).toLocaleDateString("vi-VN")}
                      </TableCell>
                      <TableCell>
                        {area.updater?.fullName ||
                          area.creator?.fullName ||
                          "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="mr-2"
                          onClick={() => handleEdit(area)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => handleDelete(area.id, area.name)}
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
