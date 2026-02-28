// cspell:disable
"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import {
  productService,
  categoryService,
  Product,
  Category,
} from "@/services/product.service";
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
import { Plus, Pencil, Trash2, ImageOff } from "lucide-react";
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
import { Upload } from "lucide-react";
import { formatNumber, parseNumber } from "@/lib/utils";
import { Permission } from "@/types";
import { PermissionGuard } from "@/components/shared/PermissionGuard";
import { ApprovalReasonDialog } from "@/components/shared/ApprovalReasonDialog";
import { ImageEditorDialog } from "@/components/shared/ImageEditorDialog";
import { useAuth } from "@/components/providers/auth-provider";
import {
  collectErrors,
  required,
  noSpecialChars,
  positiveNumber,
  maxLength,
  noHtml,
  inputErrorClass,
} from "@/lib/validators";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function ProductPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    price: 0,
    categoryId: "",
    isAvailable: true,
    imageUrl: "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  // Approval reason dialog state
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [approvalActionTitle, setApprovalActionTitle] = useState("");
  const [pendingAction, setPendingAction] = useState<
    ((reason: string) => Promise<void>) | null
  >(null);
  const [imageEditorOpen, setImageEditorOpen] = useState(false);
  const [rawImageSrc, setRawImageSrc] = useState<string | null>(null);
  const { user } = useAuth();
  const isAdmin = (user?.role as { name?: string } | null)?.name === "ADMIN";
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isDeletingBulk, setIsDeletingBulk] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setSelectedIds([]);
    try {
      const [productData, categoryData] = await Promise.all([
        productService.getAll(),
        categoryService.getAll(),
      ]);
      setProducts(productData);
      setCategories(categoryData);
    } catch (error) {
      console.error("Failed to load product data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setRawImageSrc(reader.result as string);
        setImageEditorOpen(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageEditConfirm = async (blob: Blob) => {
    setImageEditorOpen(false);
    const file = new File([blob], "cropped.jpg", { type: "image/jpeg" });
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(blob));
  };

  const resetForm = () => {
    setNewProduct({
      name: "",
      description: "",
      price: 0,
      categoryId: "",
      isAvailable: true,
      imageUrl: "",
    });
    setSelectedFile(null);
    setPreviewUrl(null);
    setEditingProduct(null);
    setIsEditMode(false);
    setFormErrors({});
    setApiError(null);
  };

  const handleEdit = async (product: Product) => {
    try {
      // Fetch fresh data from API
      const freshData = await productService.getOne(product.id);
      setEditingProduct(freshData);
      setIsEditMode(true);
      setNewProduct({
        name: freshData.name,
        description: freshData.description || "",
        price: freshData.price,
        categoryId: freshData.categoryId.toString(),
        isAvailable: freshData.isAvailable,
        imageUrl: freshData.imageUrl || "",
      });
      if (freshData.imageUrl) {
        setPreviewUrl(
          freshData.imageUrl.startsWith("http")
            ? freshData.imageUrl
            : `${API_BASE_URL.replace("/api", "")}${freshData.imageUrl}`,
        );
      }
      setIsDialogOpen(true);
    } catch (error) {
      console.error("Failed to load product details:", error);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!isAdmin) {
      // Non-admin: show approval reason dialog
      setApprovalActionTitle(`Xóa sản phẩm "${name}"`);
      setPendingAction(() => async (reason: string) => {
        await productService.delete(id, reason);
        setApprovalDialogOpen(false);
        loadData();
      });
      setApprovalDialogOpen(true);
      return;
    }
    if (confirm(`Bạn có chắc muốn xóa sản phẩm "${name}"?`)) {
      try {
        await productService.delete(id);
        loadData();
      } catch (error) {
        console.error("Failed to delete product:", error);
        alert("Xóa sản phẩm thất bại!");
      }
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(products.map((p) => p.id));
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
    if (!isAdmin) {
      setApprovalActionTitle(`Xóa ${selectedIds.length} sản phẩm đã chọn`);
      setPendingAction(() => async (reason: string) => {
        setIsDeletingBulk(true);
        try {
          await Promise.all(
            selectedIds.map((id) => productService.delete(id, reason)),
          );
          setSelectedIds([]);
          setApprovalDialogOpen(false);
          loadData();
        } catch (error) {
          console.error("Failed to bulk delete products:", error);
          alert("Xóa hàng loạt thất bại!");
        } finally {
          setIsDeletingBulk(false);
        }
      });
      setApprovalDialogOpen(true);
      return;
    }
    if (
      confirm(`Bạn có chắc muốn xóa ${selectedIds.length} sản phẩm đã chọn?`)
    ) {
      setIsDeletingBulk(true);
      try {
        await Promise.all(selectedIds.map((id) => productService.delete(id)));
        setSelectedIds([]);
        loadData();
      } catch (error) {
        console.error("Failed to bulk delete products:", error);
        alert("Xóa hàng loạt thất bại!");
      } finally {
        setIsDeletingBulk(false);
      }
    }
  };

  const handleCreateProduct = async (reason?: string) => {
    if (!reason) {
      const errors = collectErrors({
        name: required(newProduct.name) || noSpecialChars(newProduct.name),
        price: positiveNumber(newProduct.price),
        categoryId: required(newProduct.categoryId),
        description:
          maxLength(newProduct.description, 1000) ||
          noHtml(newProduct.description),
      });
      if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        return;
      }
      setFormErrors({});
    }
    setApiError(null);
    setIsSaving(true);
    try {
      if (!newProduct.categoryId) return;

      let imageUrl = newProduct.imageUrl;

      // 1. Upload image if selected
      if (selectedFile) {
        try {
          imageUrl = await productService.uploadImage(selectedFile);
        } catch (uploadError) {
          console.error("Failed to upload image:", uploadError);
        }
      }

      if (isEditMode && editingProduct) {
        if (!isAdmin && !reason) {
          // Show reason dialog
          setApprovalActionTitle(`Cập nhật sản phẩm "${editingProduct.name}"`);
          setPendingAction(() => async (r: string) => {
            await productService.update(editingProduct.id, {
              ...newProduct,
              imageUrl,
              categoryId: parseInt(newProduct.categoryId),
              price: Number(newProduct.price),
              reason: r,
            } as Parameters<typeof productService.update>[1] & {
              reason?: string;
            });
            setApprovalDialogOpen(false);
            resetForm();
            setIsDialogOpen(false);
            loadData();
          });
          setApprovalDialogOpen(true);
          return;
        }
        await productService.update(editingProduct.id, {
          ...newProduct,
          imageUrl,
          categoryId: parseInt(newProduct.categoryId),
          price: Number(newProduct.price),
          ...(reason ? { reason } : {}),
        } as Parameters<typeof productService.update>[1] & { reason?: string });
      } else {
        // Create new product
        await productService.create({
          ...newProduct,
          imageUrl,
          categoryId: parseInt(newProduct.categoryId),
          price: Number(newProduct.price),
        });
      }

      resetForm();
      setIsDialogOpen(false);
      loadData();
    } catch (error) {
      console.error("Failed to save product:", error);
      const msg =
        error instanceof Error ? error.message : "Lưu sản phẩm thất bại!";
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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">
            Danh sách Sản phẩm
          </h1>
          <Dialog
            open={isDialogOpen}
            onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) resetForm(); // Reset when dialog closes
            }}
          >
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground">
                <Plus className="mr-2 h-4 w-4" /> Thêm sản phẩm
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-125">
              <DialogHeader>
                <DialogTitle>
                  {isEditMode ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"}
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
                    Tên sản phẩm <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={newProduct.name}
                    onChange={(e) => {
                      setNewProduct({ ...newProduct, name: e.target.value });
                      if (formErrors.name)
                        setFormErrors((p) => ({ ...p, name: "" }));
                    }}
                    placeholder="VD: Cà phê đá, Matcha..."
                    className={inputErrorClass(formErrors.name)}
                  />
                  {formErrors.name && (
                    <p className="text-xs text-destructive mt-1">
                      {formErrors.name}
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="price">
                      Giá bán (VNĐ) <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="price"
                      value={formatNumber(newProduct.price)}
                      onChange={(e) => {
                        setNewProduct({
                          ...newProduct,
                          price: parseNumber(e.target.value),
                        });
                        if (formErrors.price)
                          setFormErrors((p) => ({ ...p, price: "" }));
                      }}
                      placeholder="VD: 20.000"
                      className={inputErrorClass(formErrors.price)}
                    />
                    {formErrors.price && (
                      <p className="text-xs text-destructive mt-1">
                        {formErrors.price}
                      </p>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="category">
                      Danh mục <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={newProduct.categoryId}
                      onValueChange={(value) => {
                        setNewProduct({ ...newProduct, categoryId: value });
                        if (formErrors.categoryId)
                          setFormErrors((p) => ({ ...p, categoryId: "" }));
                      }}
                    >
                      <SelectTrigger
                        className={inputErrorClass(formErrors.categoryId)}
                      >
                        <SelectValue placeholder="Chọn danh mục" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id.toString()}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formErrors.categoryId && (
                      <p className="text-xs text-destructive mt-1">
                        {formErrors.categoryId}
                      </p>
                    )}
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Hình ảnh sản phẩm</Label>
                  <div className="flex flex-col items-center gap-4 p-4 border-2 border-dashed rounded-lg border-muted">
                    {previewUrl ? (
                      <div className="relative h-32 w-32">
                        <Image
                          src={previewUrl}
                          alt="Preview"
                          fill
                          className="object-cover rounded-md"
                        />
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute -top-2 -right-2 h-6 w-6"
                          onClick={() => {
                            setSelectedFile(null);
                            setPreviewUrl(null);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <div
                        className="flex flex-col items-center gap-2 cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <div className="p-4 bg-muted rounded-full">
                          <Upload className="h-6 w-6" />
                        </div>
                        <span className="text-sm font-medium">
                          Click để chọn ảnh
                        </span>
                      </div>
                    )}
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Mô tả sản phẩm</Label>
                  <Input
                    id="description"
                    value={newProduct.description}
                    onChange={(e) => {
                      setNewProduct({
                        ...newProduct,
                        description: e.target.value,
                      });
                      if (formErrors.description)
                        setFormErrors((p) => ({ ...p, description: "" }));
                    }}
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
                <Button
                  onClick={() => void handleCreateProduct()}
                  disabled={isSaving}
                >
                  {isSaving ? "Đang lưu..." : isEditMode ? "Cập nhật" : "Lưu"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle>Danh sách sản phẩm</CardTitle>
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
                        products.length > 0 &&
                        selectedIds.length === products.length
                      }
                      onCheckedChange={handleSelectAll}
                      aria-label="Select all"
                    />
                  </TableHead>
                  <TableHead className="w-15 text-center">STT</TableHead>
                  <TableHead className="w-20">Ảnh</TableHead>
                  <TableHead>Tên sản phẩm</TableHead>
                  <TableHead>Danh mục</TableHead>
                  <TableHead>Giá</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Ngày cập nhật</TableHead>
                  <TableHead>Người cập nhật</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8">
                      Đang tải...
                    </TableCell>
                  </TableRow>
                ) : products.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={10}
                      className="text-center py-8 text-muted-foreground"
                    >
                      Chưa có sản phẩm nào
                    </TableCell>
                  </TableRow>
                ) : (
                  products.map((product, index) => (
                    <TableRow
                      key={product.id}
                      data-state={
                        selectedIds.includes(product.id)
                          ? "selected"
                          : undefined
                      }
                    >
                      <TableCell className="text-center">
                        <Checkbox
                          checked={selectedIds.includes(product.id)}
                          onCheckedChange={(checked) =>
                            handleSelectRow(product.id, !!checked)
                          }
                          aria-label={`Select row ${product.id}`}
                        />
                      </TableCell>
                      <TableCell className="text-center font-medium">
                        {index + 1}
                      </TableCell>
                      <TableCell>
                        {product.imageUrl ? (
                          <Image
                            src={
                              product.imageUrl.startsWith("http")
                                ? product.imageUrl
                                : `${API_BASE_URL.replace("/api", "")}${product.imageUrl}`
                            }
                            alt={product.name}
                            width={40}
                            height={40}
                            className="h-10 w-10 rounded-md object-cover"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center">
                            <ImageOff className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        {product.name}
                      </TableCell>
                      <TableCell>{product.category?.name || "K/X"}</TableCell>
                      <TableCell>
                        {new Intl.NumberFormat("vi-VN", {
                          style: "currency",
                          currency: "VND",
                        }).format(product.price)}
                      </TableCell>
                      <TableCell>
                        {product.isAvailable ? (
                          <Badge
                            variant="outline"
                            className="bg-emerald-50 text-emerald-700 border-emerald-200"
                          >
                            Kinh doanh
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Ngừng bán</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(product.updatedAt).toLocaleDateString(
                          "vi-VN",
                        )}
                      </TableCell>
                      <TableCell>
                        {product.updater?.fullName ||
                          product.creator?.fullName ||
                          "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="mr-2"
                          onClick={() => handleEdit(product)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => handleDelete(product.id, product.name)}
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
      {/* Approval reason dialog for non-admin users */}
      <ApprovalReasonDialog
        open={approvalDialogOpen}
        onOpenChange={setApprovalDialogOpen}
        actionTitle={approvalActionTitle}
        onConfirm={async (reason: string) => {
          if (pendingAction) {
            await pendingAction(reason);
          }
        }}
      />
      {/* Image Editor Dialog */}
      <ImageEditorDialog
        open={imageEditorOpen}
        imageSrc={rawImageSrc || ""}
        onClose={() => {
          setImageEditorOpen(false);
          setRawImageSrc(null);
          if (fileInputRef.current) fileInputRef.current.value = "";
        }}
        onConfirm={handleImageEditConfirm}
      />
    </PermissionGuard>
  );
}
