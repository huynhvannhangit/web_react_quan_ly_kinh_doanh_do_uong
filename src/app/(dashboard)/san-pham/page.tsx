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

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
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
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
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
    setSelectedFile(null);
    setPreviewUrl(null);
    setEditingProduct(null);
    setIsEditMode(false);
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

  const handleCreateProduct = async () => {
    try {
      if (!newProduct.categoryId) return;

      let imageUrl = newProduct.imageUrl;

      // 1. Upload image if selected
      if (selectedFile) {
        try {
          imageUrl = await productService.uploadImage(selectedFile);
        } catch (uploadError) {
          console.error("Failed to upload image:", uploadError);
          // Continue with creation but maybe without image or with old URL
        }
      }

      if (isEditMode && editingProduct) {
        // Update existing product
        await productService.update(editingProduct.id, {
          ...newProduct,
          imageUrl,
          categoryId: parseInt(newProduct.categoryId),
          price: Number(newProduct.price),
        });
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
      console.error("Failed to create product:", error);
    }
  };

  return (
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
              <div className="grid gap-2">
                <Label htmlFor="name">Tên sản phẩm</Label>
                <Input
                  id="name"
                  value={newProduct.name}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, name: e.target.value })
                  }
                  placeholder="VD: Cà phê đá, Matcha..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="price">Giá bán (VNĐ)</Label>
                  <Input
                    id="price"
                    type="number"
                    value={newProduct.price}
                    onChange={(e) =>
                      setNewProduct({
                        ...newProduct,
                        price: parseFloat(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="category">Danh mục</Label>
                  <Select
                    value={newProduct.categoryId}
                    onValueChange={(value) =>
                      setNewProduct({ ...newProduct, categoryId: value })
                    }
                  >
                    <SelectTrigger>
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
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      description: e.target.value,
                    })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Hủy
              </Button>
              <Button
                onClick={handleCreateProduct}
                disabled={!newProduct.name || !newProduct.categoryId}
              >
                {isEditMode ? "Cập nhật" : "Lưu"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách sản phẩm</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">Ảnh</TableHead>
                <TableHead>Tên sản phẩm</TableHead>
                <TableHead>Danh mục</TableHead>
                <TableHead>Giá</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Đang tải...
                  </TableCell>
                </TableRow>
              ) : products.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-8 text-muted-foreground"
                  >
                    Chưa có sản phẩm nào
                  </TableCell>
                </TableRow>
              ) : (
                products.map((product) => (
                  <TableRow key={product.id}>
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
  );
}
