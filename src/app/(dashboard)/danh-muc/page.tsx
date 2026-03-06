// cspell:disable
"use client";

import React, { useEffect, useState } from "react";
import { categoryService, Category } from "@/services/product.service";
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

  const filteredCategories = categories;

  useEffect(() => {
    void loadCategories();
  }, []);

  const loadCategories = async (keyword?: string) => {
    setIsLoading(true);
    setSelectedIds([]);
    try {
      const data = await categoryService.getAll(keyword);
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
    setConfirmState({
      isOpen: true,
      title: "Xác nhận xóa danh mục",
      description: `Bạn có chắc muốn xóa danh mục "${name}"?`,
      isDanger: true,
      onConfirm: async () => {
        try {
          await categoryService.delete(id);
          toast.success("Xóa danh mục thành công");
          loadCategories();
        } catch (error) {
          console.error("Failed to delete category:", error);
          toast.error("Xóa danh mục thất bại!");
        } finally {
          setConfirmState((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
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
    setConfirmState({
      isOpen: true,
      title: "Xác nhận xóa hàng loạt",
      description: `Bạn có chắc muốn xóa ${selectedIds.length} danh mục đã chọn?`,
      isDanger: true,
      onConfirm: async () => {
        setIsDeletingBulk(true);
        try {
          await categoryService.deleteMany(selectedIds);
          setSelectedIds([]);
          toast.success("Xóa hàng loạt thành công");
          loadCategories();
        } catch (error) {
          console.error("Failed to bulk delete categories:", error);
          toast.error("Xóa hàng loạt thất bại!");
        } finally {
          setIsDeletingBulk(false);
          setConfirmState((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const handleCreateCategory = async () => {
    const errors = collectErrors({
      name: required(newCategory.name) || noSpecialChars(newCategory.name),
      description:
        noSpecialChars(newCategory.description) ||
        maxLength(newCategory.description, 1000) ||
        noHtml(newCategory.description),
    });
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});
    setIsSaving(true);
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
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <PermissionGuard
      permissions={[Permission.PRODUCT_VIEW]}
      redirect="/dashboard"
    >
      <Card>
        <CardContent className="p-8 space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold tracking-wide text-[#00509E] uppercase">
              Quản lý Danh mục
            </h1>
          </div>

          <div className="flex flex-wrap items-end justify-between mt-6 w-full gap-4">
            <div className="hidden lg:block lg:flex-1" />

            <div className="flex flex-col gap-1 w-full max-w-150">
              <label className="text-xs text-muted-foreground text-left">
                Tên danh mục
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
                onClick={() => void loadCategories(searchTerm)}
                className="gap-2 bg-[#00509E] hover:bg-[#00509E]/90 text-white rounded-lg"
              >
                <Search className="h-4 w-4" />
                Tìm kiếm
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  void loadCategories();
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
                        {" "}
                        {/* Changed id from categoryName to name */}
                        Tên danh mục <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="name" // Changed id from categoryName to name
                        value={newCategory.name} // Changed from categoryName to name
                        onChange={(e) => {
                          setNewCategory({
                            ...newCategory,
                            name: e.target.value, // Changed from categoryName to name
                          });
                          if (formErrors.name)
                            // Changed from categoryName to name
                            setFormErrors((p) => ({ ...p, name: "" })); // Changed from categoryName to name
                        }}
                        placeholder="VD: Cà phê, Trà sữa..."
                        className={inputErrorClass(formErrors.name)} // Changed from categoryName to name
                      />
                      {formErrors.name && ( // Changed from categoryName to name
                        <p className="text-xs text-destructive mt-1">
                          {formErrors.name}{" "}
                          {/* Changed from categoryName to name */}
                        </p>
                      )}
                    </div>
                    {/* Description input removed from dialog as per instruction */}
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                    >
                      Hủy
                    </Button>
                    <Button onClick={handleCreateCategory} disabled={isSaving}>
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
                <CardTitle className="text-lg font-semibold text-slate-800">
                  Danh sách danh mục
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
                            filteredCategories.length > 0 && // Changed from categories to filteredCategories
                            selectedIds.length === filteredCategories.length // Changed from categories to filteredCategories
                          }
                          onCheckedChange={handleSelectAll}
                          aria-label="Select all" // Added aria-label
                        />
                      </TableHead>
                      <TableHead className="w-16 text-center">STT</TableHead>
                      <TableHead>Tên danh mục</TableHead>
                      <TableHead>Ngày cập nhật</TableHead>
                      {/* Removed "Người cập nhật" TableHead */}
                      <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-12">
                          {" "}
                          {/* colSpan changed from 7 to 6 */}
                          <div className="flex flex-col items-center gap-2 text-muted-foreground">
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                            Đang tải dữ liệu...
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : filteredCategories.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={6} // colSpan changed from 7 to 6
                          className="text-center py-12 text-muted-foreground"
                        >
                          {searchTerm
                            ? "Không tìm thấy danh mục phù hợp"
                            : "Chưa có danh mục nào"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredCategories.map((category, index) => (
                        <TableRow
                          key={category.id}
                          className="hover:bg-muted/50 transition-colors border-border"
                          data-state={
                            // Added data-state
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
                              aria-label={`Select row ${category.id}`} // Added aria-label
                            />
                          </TableCell>
                          <TableCell className="text-center font-medium text-slate-500">
                            {index + 1}
                          </TableCell>
                          <TableCell className="font-semibold text-foreground">
                            {category.name}{" "}
                            {/* Changed from categoryName to name */}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(category.updatedAt).toLocaleDateString(
                              "vi-VN",
                            )}
                          </TableCell>
                          {/* Removed "Người cập nhật" TableCell */}
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2 text-slate-500">
                              <button
                                className="p-2 hover:text-[#00509E] hover:bg-[#00509E]/10 rounded-lg transition-all"
                                onClick={() => handleEdit(category)}
                                title="Chỉnh sửa" // Added title
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button
                                className="p-2 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                onClick={
                                  () => handleDelete(category.id, category.name) // Changed from categoryName to name
                                }
                                title="Xóa" // Added title
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
