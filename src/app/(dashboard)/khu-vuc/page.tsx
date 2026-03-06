"use client";

import React, { useEffect, useState } from "react";
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
import {
  collectErrors,
  required,
  noSpecialChars,
  maxLength,
  noHtml,
  inputErrorClass,
} from "@/lib/validators";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";

export default function AreaPage() {
  const [areas, setAreas] = useState<Area[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newArea, setNewArea] = useState({ name: "", description: "" });
  const [editingArea, setEditingArea] = useState<Area | null>(null);
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

  useEffect(() => {
    void loadAreas();
  }, []);

  const loadAreas = async (keyword?: string) => {
    setIsLoading(true);
    setSelectedIds([]);
    try {
      const data = await areaService.getAll(keyword);
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
    setFormErrors({});
    setApiError(null);
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
    setConfirmState({
      isOpen: true,
      title: "Xác nhận xóa khu vực",
      description: `Bạn có chắc muốn xóa khu vực "${name}"?`,
      isDanger: true,
      onConfirm: async () => {
        try {
          await areaService.delete(id);
          toast.success("Xóa khu vực thành công");
          loadAreas();
        } catch (error) {
          console.error("Failed to delete area:", error);
          toast.error("Xóa khu vực thất bại!");
        } finally {
          setConfirmState((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(areas.map((a) => a.id));
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
      description: `Bạn có chắc muốn xóa ${selectedIds.length} khu vực đã chọn?`,
      isDanger: true,
      onConfirm: async () => {
        setIsDeletingBulk(true);
        try {
          await areaService.deleteMany(selectedIds);
          setSelectedIds([]);
          toast.success("Xóa hàng loạt thành công");
          loadAreas();
        } catch (error) {
          console.error("Failed to bulk delete areas:", error);
          toast.error("Xóa hàng loạt thất bại!");
        } finally {
          setIsDeletingBulk(false);
          setConfirmState((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const handleCreateArea = async () => {
    const errors = collectErrors({
      name: required(newArea.name) || noSpecialChars(newArea.name),
      description:
        noSpecialChars(newArea.description) ||
        maxLength(newArea.description, 1000) ||
        noHtml(newArea.description),
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
        name: newArea.name.trim(),
        description: newArea.description.trim(),
      };
      if (isEditMode && editingArea) {
        await areaService.update(editingArea.id, payload);
      } else {
        await areaService.create(payload);
      }
      resetForm();
      setIsDialogOpen(false);
      loadAreas();
    } catch (error) {
      console.error("Failed to save area:", error);
      const msg =
        error instanceof Error ? error.message : "Lưu khu vực thất bại!";
      setApiError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <PermissionGuard permissions={[Permission.AREA_VIEW]} redirect="/dashboard">
      <Card>
        <CardContent className="p-8 space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold tracking-wide text-[#00509E] dark:text-blue-400 uppercase">
              Quản lý Khu vực
            </h1>
          </div>

          <div className="flex flex-wrap items-end justify-between mt-6 w-full gap-4">
            <div className="hidden lg:block lg:flex-1" />

            <div className="flex flex-col gap-1 w-full max-w-150">
              <label className="text-xs text-muted-foreground text-left">
                Tên khu vực
              </label>
              <Input
                placeholder="Tìm kiếm..."
                className="bg-background border-border rounded-lg h-10 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    // Search is instant but can be triggered by Enter if needed
                  }
                }}
              />
            </div>

            <div className="flex-1 flex justify-end items-end gap-2 mb-0.5 min-w-fit">
              <Button
                onClick={() => void loadAreas(searchTerm)}
                className="gap-2 bg-[#00509E] hover:bg-[#00509E]/90 text-white rounded-lg"
              >
                <Search className="h-4 w-4" />
                Tìm kiếm
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  void loadAreas();
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
                      {isEditMode ? "Chỉnh sửa khu vực" : "Thêm khu vực mới"}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    {apiError && (
                      <div className="rounded-md bg-destructive/10 border border-destructive/30 px-3 py-2 text-sm text-destructive">
                        {apiError}
                      </div>
                    )}
                    <div className="grid gap-2">
                      <Label htmlFor="name">
                        Tên khu vực <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="name"
                        value={newArea.name}
                        onChange={(e) => {
                          setNewArea({ ...newArea, name: e.target.value });
                          if (formErrors.name)
                            setFormErrors((p) => ({ ...p, name: "" }));
                        }}
                        placeholder="VD: Tầng 1, Sân vườn..."
                        className={inputErrorClass(formErrors.name)}
                      />
                      {formErrors.name && (
                        <p className="text-xs text-destructive mt-1">
                          {formErrors.name}
                        </p>
                      )}
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="description">Mô tả</Label>
                      <Input
                        id="description"
                        value={newArea.description}
                        onChange={(e) => {
                          setNewArea({
                            ...newArea,
                            description: e.target.value,
                          });
                          if (formErrors.description)
                            setFormErrors((p) => ({ ...p, description: "" }));
                        }}
                        placeholder="Mô tả cho khu vực này"
                        className={inputErrorClass(formErrors.description)}
                      />
                      {formErrors.description && (
                        <p className="text-xs text-destructive mt-1">
                          {formErrors.description}
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
                    <Button onClick={handleCreateArea} disabled={isSaving}>
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
                  Danh sách khu vực
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="px-0">
              <div className="[&_th]:bg-muted [&_th]:text-muted-foreground [&_th]:font-semibold [&_td]:py-4">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-border">
                      <TableHead className="w-12 text-center">
                        <Checkbox
                          checked={
                            areas.length > 0 &&
                            selectedIds.length === areas.length
                          }
                          onCheckedChange={handleSelectAll}
                          aria-label="Select all"
                        />
                      </TableHead>
                      <TableHead className="w-16 text-center">STT</TableHead>
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
                        <TableCell colSpan={7} className="text-center py-12">
                          <div className="flex flex-col items-center gap-2 text-muted-foreground">
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                            Đang tải dữ liệu...
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : areas.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="text-center py-12 text-muted-foreground"
                        >
                          {searchTerm
                            ? "Không tìm thấy khu vực phù hợp"
                            : "Chưa có khu vực nào"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      areas.map((area, index) => (
                        <TableRow
                          key={area.id}
                          className="hover:bg-muted/50 transition-colors border-border"
                          data-state={
                            selectedIds.includes(area.id)
                              ? "selected"
                              : undefined
                          }
                        >
                          <TableCell className="text-center">
                            <Checkbox
                              checked={selectedIds.includes(area.id)}
                              onCheckedChange={(checked) =>
                                handleSelectRow(area.id, !!checked)
                              }
                              aria-label={`Select row ${area.id}`}
                            />
                          </TableCell>
                          <TableCell className="text-center font-medium text-slate-500">
                            {index + 1}
                          </TableCell>
                          <TableCell className="font-semibold text-foreground">
                            {area.name}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {area.description || "—"}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(area.updatedAt).toLocaleDateString(
                              "vi-VN",
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground border border-border">
                              {area.updater?.fullName ||
                                area.creator?.fullName ||
                                "—"}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2 text-slate-500">
                              <button
                                className="p-2 hover:text-[#00509E] hover:bg-[#00509E]/10 rounded-lg transition-all"
                                onClick={() => handleEdit(area)}
                                title="Chỉnh sửa"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button
                                className="p-2 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                onClick={() => handleDelete(area.id, area.name)}
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
