// cspell:disable
"use client";

import React, { useEffect, useState, useRef } from "react";
import Image from "next/image";
import {
  productService,
  categoryService,
  Product,
  Category,
} from "@/services/product.service";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Pagination } from "@/components/shared/Pagination";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  RotateCcw,
  Upload,
  Loader2,
  Image as ImageIcon,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
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
import { Textarea } from "@/components/ui/textarea";

import { formatNumber, parseNumber } from "@/lib/utils";
import { Permission } from "@/types";
import { PermissionGuard } from "@/components/shared/PermissionGuard";
import { ApprovalReasonDialog } from "@/components/shared/ApprovalReasonDialog";
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
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { ImageEditorDialog } from "@/components/shared/ImageEditorDialog";

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
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  // Approval reason dialog state
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [approvalActionTitle, setApprovalActionTitle] = useState("");
  const [pendingAction, setPendingAction] = useState<
    ((reason: string) => Promise<void>) | null
  >(null);
  const { user } = useAuth();
  const roleName =
    typeof user?.role === "string"
      ? user.role
      : (user?.role as { name?: string } | null)?.name;
  const isAdmin = roleName === "ADMIN" || roleName === "CHỦ CỬA HÀNG";
  const canCreate = user?.permissions?.includes(Permission.PRODUCT_CREATE);
  const canUpdate = user?.permissions?.includes(Permission.PRODUCT_UPDATE);
  const canDelete = user?.permissions?.includes(Permission.PRODUCT_DELETE);

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isDeletingBulk, setIsDeletingBulk] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [selectedProductFile, setSelectedProductFile] = useState<File | null>(
    null,
  );
  const [productPreviewUrl, setProductPreviewUrl] = useState<string | null>(
    null,
  );

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

  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageEditorOpen, setImageEditorOpen] = useState(false);
  const [rawImageSrc, setRawImageSrc] = useState<string | null>(null);

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    void loadData();
  }, []);

  // Cleanup object urls on unmount
  useEffect(() => {
    return () => {
      if (productPreviewUrl) URL.revokeObjectURL(productPreviewUrl);
    };
  }, [productPreviewUrl]);

  const totalPages = Math.max(1, Math.ceil(products.length / pageSize));
  const paginatedProducts = products.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  const globalOffset = (currentPage - 1) * pageSize;

  const loadData = async (keyword?: string) => {
    setIsLoading(true);
    setSelectedIds([]);
    try {
      const [productData, categoryData] = await Promise.all([
        productService.getAll(keyword),
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

  const resetForm = () => {
    setNewProduct({
      name: "",
      description: "",
      price: 0,
      categoryId: "",
      isAvailable: true,
      imageUrl: "",
    });
    setEditingProduct(null);
    setIsEditMode(false);
    setFormErrors({});
    setApiError(null);
    setSelectedProductFile(null);
    if (productPreviewUrl) {
      URL.revokeObjectURL(productPreviewUrl);
      setProductPreviewUrl(null);
    }
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn file hình ảnh (JPG, PNG, ...)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Kích thước ảnh không được vượt quá 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setRawImageSrc(reader.result as string);
      setImageEditorOpen(true);
    };
    reader.readAsDataURL(file);

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleImageEditConfirm = async (blob: Blob) => {
    setImageEditorOpen(false);
    const file = new File([blob], "product-image.jpg", { type: "image/jpeg" });

    // Lưu ảnh ở chế độ chờ thay vì upload ngay
    setSelectedProductFile(file);
    const previewUrl = URL.createObjectURL(blob);
    setProductPreviewUrl(previewUrl);
    setRawImageSrc(null);
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

    setConfirmState({
      isOpen: true,
      title: "Xác nhận xóa sản phẩm",
      description: `Bạn có chắc muốn xóa sản phẩm "${name}"?`,
      isDanger: true,
      onConfirm: async () => {
        try {
          await productService.delete(id);
          toast.success("Xóa sản phẩm thành công");
          loadData();
        } catch (error) {
          console.error("Failed to delete product:", error);
          toast.error("Xóa sản phẩm thất bại!");
        } finally {
          setConfirmState((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
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
          await productService.deleteMany(selectedIds, reason);
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

    setConfirmState({
      isOpen: true,
      title: "Xác nhận xóa hàng loạt",
      description: `Bạn có chắc muốn xóa ${selectedIds.length} sản phẩm đã chọn?`,
      isDanger: true,
      onConfirm: async () => {
        setIsDeletingBulk(true);
        try {
          await productService.deleteMany(selectedIds);
          setSelectedIds([]);
          toast.success("Xóa hàng loạt thành công");
          loadData();
        } catch (error) {
          console.error("Failed to bulk delete products:", error);
          toast.error("Xóa hàng loạt thất bại!");
        } finally {
          setIsDeletingBulk(false);
          setConfirmState((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
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

      let finalImageUrl = newProduct.imageUrl;

      // Upload ảnh nếu có ảnh chọn mới ở chế độ chờ
      if (selectedProductFile) {
        setIsUploading(true);
        try {
          finalImageUrl = await productService.uploadImage(selectedProductFile);
        } catch (error) {
          console.error("Upload failed", error);
          toast.error("Không thể tải lên hình ảnh sản phẩm");
          setIsUploading(false);
          setIsSaving(false);
          return;
        }
        setIsUploading(false);
      }

      const imageUrl = finalImageUrl;

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
        (error as { customMessage?: string }).customMessage ||
        (error instanceof Error ? error.message : "Lưu sản phẩm thất bại!");
      setApiError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <PermissionGuard
      permissions={[Permission.PRODUCT_VIEW_ALL]}
      redirect="/dashboard"
    >
      {isMounted && (
        <>
          <Card>
            <CardContent className="p-8 space-y-6">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-wide text-[#00509E] dark:text-blue-400 uppercase">
                  Quản lý Sản phẩm
                </h1>
              </div>

              <div className="flex flex-wrap items-end justify-between mt-6 w-full gap-4">
                <div className="flex flex-col gap-1 w-full max-w-150">
                  <label className="text-xs text-muted-foreground text-left">
                    Tên sản phẩm hoặc danh mục
                  </label>
                  <Input
                    placeholder="Tìm kiếm..."
                    className="bg-background border-border rounded-lg h-10 w-full"
                    value={searchTerm}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setSearchTerm(e.target.value)
                    }
                    onKeyDown={(e) => e.key === "Enter" && loadData()}
                  />
                </div>

                <div className="flex-1 flex justify-end items-end gap-2 mb-0.5 min-w-fit">
                  <Button
                    onClick={() => loadData(searchTerm)}
                    className="gap-2 bg-[#00509E] hover:bg-[#00509E]/90 text-white rounded-lg"
                  >
                    <Search className="h-4 w-4" />
                    Tìm kiếm
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchTerm("");
                      loadData();
                    }}
                    className="gap-2 rounded-lg"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Làm mới
                  </Button>

                  {canCreate && (
                    <Dialog
                      open={isDialogOpen}
                      onOpenChange={(open) => {
                        setIsDialogOpen(open);
                        if (!open) resetForm();
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button className="bg-[#00509E] hover:bg-[#00509E]/90 text-white h-10 rounded-lg px-6">
                          <Plus className="mr-2 h-4 w-4" /> Thêm
                        </Button>
                      </DialogTrigger>

                      <DialogContent className="sm:max-w-150">
                        <DialogHeader>
                          <DialogTitle>
                            {isEditMode
                              ? "Chỉnh sửa sản phẩm"
                              : "Thêm sản phẩm mới"}
                          </DialogTitle>
                          <DialogDescription>
                            Cung cấp thông tin chi tiết về sản phẩm để quản lý
                            kinh doanh. Các trường đánh dấu * là bắt buộc.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="max-h-[70vh] overflow-y-auto px-1 -mx-1">
                          <div className="grid gap-4 py-4">
                            {apiError && (
                              <div className="rounded-md bg-destructive/10 border border-destructive/30 px-3 py-2 text-sm text-destructive">
                                {apiError}
                              </div>
                            )}
                            <div className="grid gap-2">
                              <Label
                                htmlFor="name"
                                className="text-sm font-medium"
                              >
                                Tên sản phẩm{" "}
                                <span className="text-destructive">*</span>
                              </Label>
                              <Input
                                id="name"
                                value={newProduct.name}
                                onChange={(e) => {
                                  setNewProduct({
                                    ...newProduct,
                                    name: e.target.value,
                                  });
                                  if (formErrors.name)
                                    setFormErrors((p) => ({ ...p, name: "" }));
                                }}
                                placeholder="VD: Cà phê đá, Matcha..."
                                className={inputErrorClass(formErrors.name)}
                                required
                                onInvalid={(e) =>
                                  (
                                    e.target as HTMLInputElement
                                  ).setCustomValidity(
                                    "Vui lòng điền vào trường này",
                                  )
                                }
                                onInput={(e) =>
                                  (
                                    e.target as HTMLInputElement
                                  ).setCustomValidity("")
                                }
                              />
                              {formErrors.name && (
                                <p className="text-xs text-destructive mt-1">
                                  {formErrors.name}
                                </p>
                              )}
                            </div>
                            <div className="grid gap-2">
                              <Label
                                htmlFor="description"
                                className="text-sm font-medium"
                              >
                                Mô tả
                              </Label>
                              <Textarea
                                id="description"
                                value={newProduct.description}
                                onChange={(e) => {
                                  setNewProduct({
                                    ...newProduct,
                                    description: e.target.value,
                                  });
                                  if (formErrors.description)
                                    setFormErrors((p) => ({
                                      ...p,
                                      description: "",
                                    }));
                                }}
                                placeholder="Mô tả sản phẩm..."
                                className={inputErrorClass(
                                  formErrors.description,
                                )}
                              />
                              {formErrors.description && (
                                <p className="text-xs text-destructive mt-1">
                                  {formErrors.description}
                                </p>
                              )}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="grid gap-2 col-span-2">
                                <Label
                                  htmlFor="price"
                                  className="text-sm font-medium"
                                >
                                  Giá bán (VNĐ){" "}
                                  <span className="text-destructive">*</span>
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
                                      setFormErrors((p) => ({
                                        ...p,
                                        price: "",
                                      }));
                                  }}
                                  placeholder="VD: 20.000"
                                  className={inputErrorClass(formErrors.price)}
                                  required
                                  onInvalid={(e) =>
                                    (
                                      e.target as HTMLInputElement
                                    ).setCustomValidity(
                                      "Vui lòng điền vào trường này",
                                    )
                                  }
                                  onInput={(e) =>
                                    (
                                      e.target as HTMLInputElement
                                    ).setCustomValidity("")
                                  }
                                />
                                {formErrors.price && (
                                  <p className="text-xs text-destructive mt-1">
                                    {formErrors.price}
                                  </p>
                                )}
                              </div>
                              <div className="grid gap-2">
                                <Label htmlFor="categoryId">
                                  Danh mục{" "}
                                  <span className="text-destructive">*</span>
                                </Label>
                                <Select
                                  value={
                                    newProduct.categoryId
                                      ? newProduct.categoryId.toString()
                                      : undefined
                                  }
                                  onValueChange={(val) =>
                                    setNewProduct({
                                      ...newProduct,
                                      categoryId: val,
                                    })
                                  }
                                >
                                  <SelectTrigger id="categoryId">
                                    <SelectValue placeholder="Chọn danh mục" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {Array.isArray(categories) &&
                                      categories.map((cat) => (
                                        <SelectItem
                                          key={cat.id}
                                          value={cat.id.toString()}
                                        >
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
                              <div className="grid gap-2">
                                <Label htmlFor="status">Trạng thái</Label>
                                <Select
                                  value={
                                    newProduct.isAvailable ? "true" : "false"
                                  }
                                  onValueChange={(val) =>
                                    setNewProduct({
                                      ...newProduct,
                                      isAvailable: val === "true",
                                    })
                                  }
                                >
                                  <SelectTrigger id="status">
                                    <SelectValue placeholder="Chọn trạng thái" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="true">
                                      Đang bán
                                    </SelectItem>
                                    <SelectItem value="false">
                                      Ngừng bán
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="grid gap-2 col-span-2">
                                <Label>Hình đại diện sản phẩm</Label>
                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mt-2">
                                  <div
                                    className="relative cursor-pointer group rounded-lg overflow-hidden border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-colors w-32 h-32 flex items-center justify-center bg-slate-50 shrink-0"
                                    onClick={handleImageClick}
                                  >
                                    {productPreviewUrl ||
                                    newProduct.imageUrl ? (
                                      <>
                                        <Image
                                          src={
                                            productPreviewUrl ||
                                            (newProduct.imageUrl.startsWith(
                                              "http",
                                            )
                                              ? newProduct.imageUrl
                                              : `${API_BASE_URL.replace("/api", "")}${newProduct.imageUrl}`)
                                          }
                                          alt="Product"
                                          fill
                                          sizes="128px"
                                          className="object-cover transition-transform group-hover:scale-110"
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                                          {isUploading ? (
                                            <Loader2 className="h-6 w-6 text-white animate-spin" />
                                          ) : (
                                            <Upload className="h-6 w-6 text-white" />
                                          )}
                                        </div>
                                      </>
                                    ) : (
                                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                                        {isUploading ? (
                                          <Loader2 className="h-8 w-8 animate-spin" />
                                        ) : (
                                          <>
                                            <ImageIcon className="h-8 w-8 mb-2 opacity-50" />
                                            <span className="text-xs font-medium">
                                              Chọn ảnh
                                            </span>
                                          </>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                  <div className="space-y-1 text-sm text-muted-foreground">
                                    <p>Định dạng hỗ trợ: JPG, PNG, GIF</p>
                                    <p>Kích thước tối đa: 5MB</p>
                                    <p>Tỉ lệ khuyến nghị: 1:1 (Vuông)</p>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      className="mt-2"
                                      onClick={handleImageClick}
                                      disabled={isUploading}
                                    >
                                      {isUploading ? (
                                        <>
                                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                          Đang tải...
                                        </>
                                      ) : (
                                        "Tải ảnh lên"
                                      )}
                                    </Button>
                                    <input
                                      type="file"
                                      ref={fileInputRef}
                                      onChange={handleFileChange}
                                      accept="image/png, image/jpeg, image/gif"
                                      className="hidden"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
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
                            {isSaving
                              ? "Đang lưu..."
                              : isEditMode
                                ? "Cập nhật"
                                : "Lưu"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </div>

              <Card className="border-none shadow-none">
                <CardHeader className="flex flex-row items-center justify-between pb-4 px-0">
                  <div className="flex items-center gap-4">
                    {canDelete && selectedIds.length > 0 && (
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
                      Danh sách sản phẩm
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="px-0">
                  <div className="[&_th]:bg-muted [&_th]:text-muted-foreground [&_th]:font-semibold [&_td]:py-4">
                    <Table className="min-w-325 font-sans">
                      <TableHeader>
                        <TableRow className="hover:bg-transparent border-border">
                          <TableHead className="w-12 text-center">
                            <Checkbox
                              checked={
                                products.length > 0 &&
                                selectedIds.length === products.length
                              }
                              onCheckedChange={handleSelectAll}
                            />
                          </TableHead>
                          <TableHead className="w-16 text-center whitespace-nowrap">
                            STT
                          </TableHead>
                          <TableHead className="whitespace-nowrap">
                            Ảnh
                          </TableHead>
                          <TableHead className="whitespace-nowrap">
                            Tên sản phẩm
                          </TableHead>
                          <TableHead className="whitespace-nowrap">
                            Mô tả
                          </TableHead>
                          <TableHead className="whitespace-nowrap">
                            Danh mục
                          </TableHead>
                          <TableHead className="whitespace-nowrap">
                            Giá gốc
                          </TableHead>
                          <TableHead className="whitespace-nowrap">
                            Ngày cập nhật
                          </TableHead>
                          <TableHead className="whitespace-nowrap">
                            Người cập nhật
                          </TableHead>
                          <TableHead className="whitespace-nowrap">
                            Trạng thái
                          </TableHead>
                          {(canUpdate || canDelete) && (
                            <TableHead className="text-right">
                              Thao tác
                            </TableHead>
                          )}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isLoading ? (
                          <TableRow>
                            <TableCell
                              colSpan={10}
                              className="text-center py-12"
                            >
                              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                                Đang tải dữ liệu...
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : products.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={10}
                              className="text-center py-12 text-muted-foreground"
                            >
                              {searchTerm
                                ? "Không tìm thấy sản phẩm phù hợp"
                                : "Chưa có sản phẩm nào"}
                            </TableCell>
                          </TableRow>
                        ) : (
                          paginatedProducts.map((product, index) => (
                            <TableRow
                              key={product.id}
                              className="hover:bg-muted/50 transition-colors border-border"
                            >
                              <TableCell className="text-center">
                                <Checkbox
                                  checked={selectedIds.includes(product.id)}
                                  onCheckedChange={(checked) =>
                                    handleSelectRow(product.id, !!checked)
                                  }
                                />
                              </TableCell>
                              <TableCell className="text-center font-medium text-slate-500">
                                {globalOffset + index + 1}
                              </TableCell>
                              <TableCell>
                                <div
                                  className="relative h-12 w-12 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 group cursor-zoom-in"
                                  onClick={() => {
                                    if (product.imageUrl) {
                                      const fullUrl =
                                        product.imageUrl.startsWith("http")
                                          ? product.imageUrl
                                          : `${API_BASE_URL.replace("/api", "")}${product.imageUrl}`;
                                      setPreviewImageUrl(fullUrl);
                                    }
                                  }}
                                >
                                  <Image
                                    src={
                                      product.imageUrl
                                        ? product.imageUrl.startsWith("http")
                                          ? product.imageUrl
                                          : `${API_BASE_URL.replace("/api", "")}${product.imageUrl}`
                                        : "/placeholder-product.png"
                                    }
                                    alt={product.name}
                                    width={48}
                                    height={48}
                                    className="h-full w-full object-cover transition-transform group-hover:scale-110"
                                  />
                                </div>
                              </TableCell>
                              <TableCell className="font-semibold text-foreground whitespace-nowrap">
                                {product.name}
                              </TableCell>
                              <TableCell className="text-muted-foreground min-w-40 max-w-60 truncate">
                                {product.description || "—"}
                              </TableCell>
                              <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                                {product.category?.name || "—"}
                              </TableCell>
                              <TableCell className="whitespace-nowrap">
                                {formatNumber(product.price)}
                              </TableCell>
                              <TableCell className="text-muted-foreground whitespace-nowrap">
                                {new Date(product.updatedAt).toLocaleDateString(
                                  "vi-VN",
                                )}
                              </TableCell>
                              <TableCell className="text-muted-foreground whitespace-nowrap">
                                {product.updater?.fullName || "—"}
                              </TableCell>
                              <TableCell className="whitespace-nowrap">
                                {product.isAvailable ? (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                    Đang bán
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400">
                                    Ngừng bán
                                  </span>
                                )}
                              </TableCell>
                              {(canUpdate || canDelete) && (
                                <TableCell className="text-right whitespace-nowrap">
                                  <div className="flex items-center justify-end gap-2 text-slate-500">
                                    {canUpdate && (
                                      <button
                                        className="p-2 hover:text-[#00509E] hover:bg-[#00509E]/10 rounded-lg transition-all"
                                        onClick={() => void handleEdit(product)}
                                        title="Chỉnh sửa"
                                      >
                                        <Pencil className="h-4 w-4" />
                                      </button>
                                    )}
                                    {canDelete && (
                                      <button
                                        className="p-2 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                        onClick={() =>
                                          void handleDelete(
                                            product.id,
                                            product.name,
                                          )
                                        }
                                        title="Xóa"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </button>
                                    )}
                                  </div>
                                </TableCell>
                              )}
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={products.length}
                    onPageChange={setCurrentPage}
                  />
                </CardContent>
              </Card>
            </CardContent>
          </Card>

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

          <Dialog
            open={!!previewImageUrl}
            onOpenChange={(open) => !open && setPreviewImageUrl(null)}
          >
            <DialogContent className="sm:max-w-lg p-4 flex flex-col items-center gap-4">
              <DialogHeader>
                <DialogTitle>Xem ảnh sản phẩm</DialogTitle>
                <DialogDescription>
                  Xem chi tiết hình đại diện của sản phẩm.
                </DialogDescription>
              </DialogHeader>
              {previewImageUrl && (
                <div className="relative w-full" style={{ maxHeight: "70vh" }}>
                  <Image
                    src={previewImageUrl}
                    alt="Xem ảnh sản phẩm"
                    width={500}
                    height={500}
                    className="w-full h-auto object-contain rounded-md"
                    style={{ maxHeight: "65vh" }}
                  />
                </div>
              )}
            </DialogContent>
          </Dialog>
          <ImageEditorDialog
            open={imageEditorOpen}
            imageSrc={rawImageSrc || ""}
            onClose={() => {
              setImageEditorOpen(false);
              setRawImageSrc(null);
            }}
            onConfirm={handleImageEditConfirm}
          />

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
        </>
      )}
    </PermissionGuard>
  );
}
