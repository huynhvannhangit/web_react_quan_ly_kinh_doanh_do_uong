"use client";

import React, { useEffect, useState } from "react";
import { categoryService, Category } from "@/services/product.service";
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
import { Permission } from "@/types";
import { PermissionGuard } from "@/components/shared/PermissionGuard";
import {
  collectErrors,
  required,
  noSpecialChars,
  inputErrorClass,
} from "@/lib/validators";

export default function CategoryPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: "", description: "" });
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isDeletingBulk, setIsDeletingBulk] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setIsLoading(true);
    setSelectedIds([]);
    try {
      const data = await categoryService.getAll();
      setCategories(data);
    } catch (error) {
      console.error("Failed to load categories:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setNewCategory({ name: "", description: "" });
    setEditingCategory(null);
    setIsEditMode(false);
    setFormErrors({});
    setApiError(null);
  };

  const handleEdit = async (category: Category) => {
    try {
      const freshData = await categoryService.getOne(category.id);
      setEditingCategory(freshData);
      setIsEditMode(true);
      setNewCategory({
        name: freshData.name,
        description: freshData.description || "",
      });
      setIsDialogOpen(true);
    } catch (error) {
      console.error("Failed to load category details:", error);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (confirm(`Bạn có chắc muốn xóa danh mục "${name}"?`)) {
      try {
        await categoryService.delete(id);
        loadCategories();
      } catch (error) {
        console.error("Failed to delete category:", error);
        alert("Xóa danh mục thất bại!");
      }
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(categories.map((c) => c.id));
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
    if (
      confirm(`Bạn có chắc muốn xóa ${selectedIds.length} danh mục đã chọn?`)
    ) {
      setIsDeletingBulk(true);
      try {
        await Promise.all(selectedIds.map((id) => categoryService.delete(id)));
        setSelectedIds([]);
        loadCategories();
      } catch (error) {
        console.error("Failed to bulk delete categories:", error);
        alert("Xóa hàng loạt thất bại!");
      } finally {
        setIsDeletingBulk(false);
      }
    }
  };

  const handleCreateCategory = async () => {
    const errors = collectErrors({
      name: required(newCategory.name) || noSpecialChars(newCategory.name),
      description: noSpecialChars(newCategory.description),
    });
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});
    try {
      const payload = {
        name: newCategory.name.trim(),
        description: newCategory.description.trim(),
      };
      if (isEditMode && editingCategory) {
        await categoryService.update(editingCategory.id, payload);
      } else {
        await categoryService.create(payload);
      }
      resetForm();
      setIsDialogOpen(false);
      loadCategories();
    } catch (error) {
      console.error("Failed to create category:", error);
      const msg =
        error instanceof Error ? error.message : "Lưu danh mục thất bại!";
      setApiError(msg);
    }
  };

  return (
    <PermissionGuard
      permissions={[Permission.PRODUCT_VIEW]}
      redirect="/dashboard"
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">
            Danh mục Sản phẩm
          </h1>
          <Dialog
            open={isDialogOpen}
            onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) resetForm();
            }}
          >
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground">
                <Plus className="mr-2 h-4 w-4" /> Thêm danh mục
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {isEditMode ? "Chỉnh sửa danh mục" : "Thêm danh mục mới"}
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
                    Tên danh mục <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={newCategory.name}
                    onChange={(e) => {
                      setNewCategory({ ...newCategory, name: e.target.value });
                      if (formErrors.name)
                        setFormErrors((p) => ({ ...p, name: "" }));
                    }}
                    placeholder="VD: Cà phê, Nước ép, Trà sữa..."
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
                    value={newCategory.description}
                    onChange={(e) => {
                      setNewCategory({
                        ...newCategory,
                        description: e.target.value,
                      });
                      if (formErrors.description)
                        setFormErrors((p) => ({ ...p, description: "" }));
                    }}
                    placeholder="Mô tả cho nhóm sản phẩm này"
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
                <Button onClick={handleCreateCategory}>
                  {isEditMode ? "Cập nhật" : "Lưu"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle>Danh sách danh mục</CardTitle>
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
                        categories.length > 0 &&
                        selectedIds.length === categories.length
                      }
                      onCheckedChange={handleSelectAll}
                      aria-label="Select all"
                    />
                  </TableHead>
                  <TableHead className="w-15 text-center">STT</TableHead>
                  <TableHead>Tên danh mục</TableHead>
                  <TableHead>Mô tả</TableHead>
                  <TableHead>Ngày cập nhật</TableHead>
                  <TableHead>Người cập nhật</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Đang tải...
                    </TableCell>
                  </TableRow>
                ) : categories.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-8 text-muted-foreground"
                    >
                      Chưa có danh mục nào
                    </TableCell>
                  </TableRow>
                ) : (
                  categories.map((category, index) => (
                    <TableRow
                      key={category.id}
                      data-state={
                        selectedIds.includes(category.id)
                          ? "selected"
                          : undefined
                      }
                    >
                      <TableCell className="text-center">
                        <Checkbox
                          checked={selectedIds.includes(category.id)}
                          onCheckedChange={(checked) =>
                            handleSelectRow(category.id, !!checked)
                          }
                          aria-label={`Select row ${category.id}`}
                        />
                      </TableCell>
                      <TableCell className="text-center font-medium">
                        {index + 1}
                      </TableCell>
                      <TableCell className="font-medium">
                        {category.name}
                      </TableCell>
                      <TableCell>{category.description || "—"}</TableCell>
                      <TableCell>
                        {new Date(category.updatedAt).toLocaleDateString(
                          "vi-VN",
                        )}
                      </TableCell>
                      <TableCell>
                        {category.updater?.fullName ||
                          category.creator?.fullName ||
                          "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="mr-2"
                          onClick={() => handleEdit(category)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() =>
                            handleDelete(category.id, category.name)
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
