"use client";

import React, { useEffect, useState } from "react";
import { tableService, Table, TableStatus } from "@/services/table.service";
import { productService, Product } from "@/services/product.service";
import {
  orderService,
  CreateOrderDto,
  OrderStatus,
} from "@/services/order.service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Minus, ShoppingCart, Loader2, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export default function OrderingPage() {
  const [tables, setTables] = useState<Table[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [orderItems, setOrderItems] = useState<
    { product: Product; quantity: number }[]
  >([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [tableData, productData] = await Promise.all([
        tableService.getAll(),
        productService.getAll(),
      ]);
      setTables(tableData);
      setProducts(productData.filter((p) => p.isAvailable));
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTableClick = (table: Table) => {
    setSelectedTable(table);
    setOrderItems([]);
    setIsOrderDialogOpen(true);
  };

  const addToOrder = (product: Product) => {
    setOrderItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const removeFromOrder = (productId: number) => {
    setOrderItems((prev) => {
      const existing = prev.find((item) => item.product.id === productId);
      if (existing && existing.quantity > 1) {
        return prev.map((item) =>
          item.product.id === productId
            ? { ...item, quantity: item.quantity - 1 }
            : item,
        );
      }
      return prev.filter((item) => item.product.id !== productId);
    });
  };

  const handleSubmitOrder = async () => {
    if (!selectedTable || orderItems.length === 0) return;

    setIsSubmitting(true);
    try {
      const orderData: CreateOrderDto = {
        tableId: selectedTable.id,
        items: orderItems.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
          price: item.product.price,
        })),
        status: OrderStatus.PENDING,
      };

      await orderService.create(orderData);

      // Update table status locally or reload
      setIsOrderDialogOpen(false);
      loadData();
    } catch (error) {
      console.error("Failed to create order:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalPrice = orderItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0,
  );

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const getTableStatusColor = (status: TableStatus) => {
    switch (status) {
      case TableStatus.AVAILABLE:
        return "bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-700";
      case TableStatus.OCCUPIED:
        return "bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-700";
      case TableStatus.RESERVED:
        return "bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700";
      default:
        return "bg-secondary";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Gọi món tại bàn</h1>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700">
            Trống
          </Badge>
          <Badge variant="outline" className="bg-amber-50 text-amber-700">
            Đang ngồi
          </Badge>
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {tables.map((table) => (
            <Card
              key={table.id}
              className={cn(
                "cursor-pointer transition-all hover:scale-105 border-2",
                getTableStatusColor(table.status),
              )}
              onClick={() => handleTableClick(table)}
            >
              <CardHeader className="p-4 text-center">
                <CardTitle className="text-lg">
                  Bàn {table.tableNumber}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 text-center text-sm font-medium">
                {table.area?.name || "Khu vực K/X"}
                <div className="mt-1 text-xs opacity-70">
                  {table.capacity} chỗ ngồi
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Order Dialog */}
      <Dialog open={isOrderDialogOpen} onOpenChange={setIsOrderDialogOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <ShoppingCart className="h-5 w-5" />
              Gọi món cho Bàn {selectedTable?.tableNumber}
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-1 overflow-hidden p-6 gap-6">
            {/* Product Selection */}
            <div className="flex-1 flex flex-col gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Tìm món ăn, đồ uống..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <ScrollArea className="flex-1 pr-4">
                <div className="grid grid-cols-2 gap-3">
                  {filteredProducts.map((product) => (
                    <Card
                      key={product.id}
                      className="cursor-pointer hover:border-primary transition-colors flex flex-col"
                      onClick={() => addToOrder(product)}
                    >
                      <CardContent className="p-3">
                        <div className="font-semibold text-sm line-clamp-1">
                          {product.name}
                        </div>
                        <div className="text-primary font-bold mt-1">
                          {new Intl.NumberFormat("vi-VN").format(product.price)}
                          đ
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Current Order */}
            <div className="w-80 flex flex-col border rounded-lg bg-muted/50 p-4">
              <h3 className="font-bold mb-4 flex items-center justify-between">
                Đơn hàng hiện tại
                <Badge variant="secondary">{orderItems.length} món</Badge>
              </h3>
              <ScrollArea className="flex-1 -mx-2 px-2">
                <div className="space-y-4">
                  {orderItems.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground text-sm italic">
                      Chưa chọn món nào
                    </div>
                  ) : (
                    orderItems.map((item) => (
                      <div
                        key={item.product.id}
                        className="flex flex-col gap-2"
                      >
                        <div className="flex justify-between items-start">
                          <span className="text-sm font-medium leading-tight flex-1 mr-2">
                            {item.product.name}
                          </span>
                          <span className="text-sm font-bold">
                            {new Intl.NumberFormat("vi-VN").format(
                              item.product.price * item.quantity,
                            )}
                            đ
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7 rounded-sm"
                            onClick={() => removeFromOrder(item.product.id)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="text-sm font-bold w-6 text-center">
                            {item.quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7 rounded-sm"
                            onClick={() => addToOrder(item.product)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
              <div className="mt-4 pt-4 border-t space-y-4">
                <div className="flex justify-between items-center font-bold text-lg">
                  <span>Tổng cộng:</span>
                  <span className="text-primary">
                    {new Intl.NumberFormat("vi-VN").format(totalPrice)}đ
                  </span>
                </div>
                <Button
                  className="w-full"
                  size="lg"
                  disabled={orderItems.length === 0 || isSubmitting}
                  onClick={handleSubmitOrder}
                >
                  {isSubmitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Xác nhận đơn hàng
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
