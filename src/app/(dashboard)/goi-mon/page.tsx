/* cspell:disable */
"use client";

import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import { tableService, Table, TableStatus } from "@/services/table.service";
import {
  productService,
  Product,
  categoryService,
  Category,
} from "@/services/product.service";
import { areaService, Area } from "@/services/area.service";
import {
  orderService,
  Order,
  CreateOrderDto,
  OrderStatus,
} from "@/services/order.service";
import {
  invoiceService,
  PaymentMethod,
  Invoice,
  InvoiceStatus,
} from "@/services/invoice.service";
import { paymentService } from "@/services/payment.service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  Minus,
  ShoppingCart,
  Loader2,
  Search,
  ImageOff,
  Filter,
  Banknote,
  Check,
  Trash2,
  Printer,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PrintableInvoice } from "@/components/invoice/PrintableInvoice";
import { useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Permission } from "@/types";
import { PermissionGuard } from "@/components/shared/PermissionGuard";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function OrderingPage() {
  const [tables, setTables] = useState<Table[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [orderItems, setOrderItems] = useState<
    { product: Product; quantity: number; isExisting?: boolean }[]
  >([]);
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<TableStatus | "ALL">("ALL");
  const [areas, setAreas] = useState<Area[]>([]);
  const [selectedAreaId, setSelectedAreaId] = useState<string>("ALL");
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("ALL");
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    PaymentMethod.CASH,
  );
  const [cashAmount, setCashAmount] = useState<number>(0);
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [lastInvoice, setLastInvoice] = useState<Invoice | null>(null);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [vnpayQrUrl, setVnpayQrUrl] = useState<string | null>(null);
  const [pendingInvoiceId, setPendingInvoiceId] = useState<number | null>(null);
  const [orderNote, setOrderNote] = useState("");
  const printRef = useRef<HTMLDivElement>(null);

  const VN_DENOMINATIONS = [
    500000, 200000, 100000, 50000, 20000, 10000, 5000, 2000, 1000,
  ];

  const getDenominationStyle = (den: number) => {
    switch (den) {
      case 500000:
        return "bg-[#096e83] text-white hover:bg-[#065b6e] shadow-inner";
      case 200000:
        return "bg-[#b8532f] text-white hover:bg-[#974526] shadow-inner";
      case 100000:
        return "bg-[#5E8233] text-white hover:bg-[#4d6b2a] shadow-inner";
      case 50000:
        return "bg-[#A95180] text-white hover:bg-[#8f446c] shadow-inner";
      case 20000:
        return "bg-[#2b5175] text-white hover:bg-[#234261] shadow-inner";
      case 10000:
        return "bg-[#9B7D4E] text-white hover:bg-[#856b43] shadow-inner";
      default:
        return "bg-[#64748b] text-white hover:bg-[#475569] shadow-inner";
    }
  };

  useEffect(() => {
    loadData();

    // Handle VNPAY return params
    const searchParams = new URLSearchParams(window.location.search);
    const paymentIdStr = searchParams.get("paymentId");
    const successStr = searchParams.get("success");
    const messageStr = searchParams.get("message");

    if (paymentIdStr && successStr) {
      const paymentId = parseInt(paymentIdStr, 10);
      exportVnpayReturn(paymentId, successStr === "true", messageStr || "");
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!vnpayQrUrl || !pendingInvoiceId) return;

    const interval = setInterval(async () => {
      try {
        const invoice = await invoiceService.getById(pendingInvoiceId);
        if (invoice.status === InvoiceStatus.PAID) {
          setVnpayQrUrl(null);
          setPendingInvoiceId(null);
          setIsOrderDialogOpen(false);
          setLastInvoice(invoice);
          setPaymentSuccess(true);
          setIsPaymentDialogOpen(true);
          loadData();
        }
      } catch (error) {
        console.error("Lỗi khi kiểm tra hóa đơn VNPAY: ", error);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [vnpayQrUrl, pendingInvoiceId]);

  const exportVnpayReturn = async (
    invoiceId: number,
    isSuccess: boolean,
    message: string,
  ) => {
    if (isSuccess) {
      try {
        const invoice = await invoiceService.getById(invoiceId);
        setLastInvoice(invoice);
        setPaymentSuccess(true);
        setIsPaymentDialogOpen(true);
        loadData();
      } catch (error) {
        console.error("Lỗi khi tải hóa đơn VNPAY: ", error);
        alert(message);
      }
    } else {
      alert("Thanh toán VNPAY thất bại: " + message);
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [tablesData, productsData, areasData, categoriesData] =
        await Promise.all([
          tableService.getAll(),
          productService.getAll(),
          areaService.getAll(),
          categoryService.getAll(),
        ]);
      // Chỉ hiển thị các bàn không ở trạng thái bảo trì
      const activeTables = tablesData.filter(
        (t) => t.status !== TableStatus.MAINTENANCE,
      );
      setTables(activeTables);
      setProducts(productsData);
      setAreas(areasData);
      setCategories(categoriesData);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTableClick = async (table: Table) => {
    setSelectedTable(table);
    setOrderItems([]);
    setActiveOrder(null);
    setIsOrderDialogOpen(true);

    if (table.status === TableStatus.OCCUPIED) {
      try {
        const active = await orderService.getActiveByTable(table.id);
        if (active) {
          setActiveOrder(active);
          setOrderNote(active.notes || "");
          // Convert active order items to the state format
          const existingItems = active.items.map((item) => ({
            product: item.product!,
            quantity: item.quantity,
            isExisting: true,
          }));
          setOrderItems(existingItems);
        }
      } catch (error) {
        console.error("Failed to fetch active order:", error);
      }
    }
  };

  const addToOrder = (product: Product) => {
    setOrderItems((prev) => {
      const existingInCart = prev.find(
        (item) => item.product.id === product.id,
      );
      if (existingInCart) {
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
      const item = prev.find((i) => i.product.id === productId);
      if (!item) return prev;

      // Don't allow removing/reducing existing items from this specific ordering UI
      // They should be managed via a proper "Order Management" if needed
      if (
        item.isExisting &&
        item.quantity <=
          (activeOrder?.items.find((i) => i.product?.id === productId)
            ?.quantity || 0)
      ) {
        return prev;
      }

      if (item.quantity > 1) {
        return prev.map((i) =>
          i.product.id === productId ? { ...i, quantity: i.quantity - 1 } : i,
        );
      }
      return prev.filter((i) => i.product.id !== productId);
    });
  };

  const handleSubmitOrder = async (payNow = false) => {
    if (!selectedTable || orderItems.length === 0) return;

    // Filter out only new items if we have an active order
    const newItems = orderItems.filter((item) => !item.isExisting);

    // If no new items and not paying now, just close
    if (newItems.length === 0 && !payNow) {
      setIsOrderDialogOpen(false);
      return;
    }

    setIsSubmitting(true);
    try {
      let order: Order;

      if (activeOrder && newItems.length > 0) {
        // Append to existing order
        order = await orderService.addItems(
          activeOrder.id,
          newItems.map((item) => ({
            productId: Number(item.product.id),
            quantity: Number(item.quantity),
            price: Number(item.product.price),
          })),
          orderNote,
        );
      } else if (!activeOrder) {
        // Create new order
        const orderData: CreateOrderDto = {
          tableId: Number(selectedTable.id),
          notes: orderNote,
          items: orderItems.map((item) => ({
            productId: Number(item.product.id),
            quantity: Number(item.quantity),
            price: Number(item.product.price),
          })),
          status: OrderStatus.PENDING,
        };
        order = await orderService.create(orderData);
      } else {
        // Fallback for payNow without new items
        order = activeOrder;
      }

      if (payNow) {
        setCreatedOrder(order);
        setIsOrderDialogOpen(false);
        setCashAmount(0);
        setIsPaymentDialogOpen(true);
      } else {
        setIsOrderDialogOpen(false);
        loadData();
      }
    } catch (error) {
      console.error("Failed to submit order:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!activeOrder) return;

    setIsSubmitting(true);
    try {
      await orderService.cancel(activeOrder.id);
      setIsOrderDialogOpen(false);
      loadData();
    } catch (error) {
      console.error("Failed to cancel order:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProcessPayment = async () => {
    if (!createdOrder) return;

    setIsSubmitting(true);
    try {
      const invoice = await invoiceService.createFromOrder({
        orderId: createdOrder.id,
        discountPercent: discountPercent,
      });

      if (paymentMethod === PaymentMethod.VNPAY) {
        const url = await paymentService.createVnpayUrl(invoice.id);
        setVnpayQrUrl(url);
        setPendingInvoiceId(invoice.id);
        setIsPaymentDialogOpen(false);
        return;
      }

      if (paymentMethod === PaymentMethod.MOMO) {
        const url = await paymentService.createMomoUrl(invoice.id);
        setVnpayQrUrl(url); // Reusing state for simplicity
        setPendingInvoiceId(invoice.id);
        setIsPaymentDialogOpen(false);
        return;
      }

      const updatedInvoice = await invoiceService.processPayment(invoice.id, {
        paymentMethod: paymentMethod,
      });

      setLastInvoice(updatedInvoice);
      setPaymentSuccess(true);
      loadData();
    } catch (error) {
      console.error("Payment failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = () => {
    if (lastInvoice) {
      window.print();
    }
  };

  const handlePrintProvisional = async () => {
    if (!selectedTable || (orderItems.length === 0 && !activeOrder)) return;

    setIsSubmitting(true);
    try {
      let order: Order;
      const newItems = orderItems.filter((item) => !item.isExisting);

      if (activeOrder && newItems.length > 0) {
        order = await orderService.addItems(
          activeOrder.id,
          newItems.map((item) => ({
            productId: Number(item.product.id),
            quantity: Number(item.quantity),
            price: Number(item.product.price),
          })),
          orderNote,
        );
      } else if (!activeOrder) {
        const orderData: CreateOrderDto = {
          tableId: Number(selectedTable.id),
          notes: orderNote,
          items: orderItems.map((item) => ({
            productId: Number(item.product.id),
            quantity: Number(item.quantity),
            price: Number(item.product.price),
          })),
          status: OrderStatus.PENDING,
        };
        order = await orderService.create(orderData);
      } else {
        order = activeOrder;
      }

      // Refresh order state
      setActiveOrder(order);
      setOrderItems(
        order.items.map((item) => ({
          product: item.product!,
          quantity: item.quantity,
          isExisting: true,
        })),
      );

      // Create/Get provisional invoice
      const invoice = await invoiceService.createFromOrder({
        orderId: order.id,
        discountPercent: 0,
      });

      setLastInvoice(invoice);
      toast.success("Đã tạo phiếu tạm tính");

      // Give a tick for the printable invoice to render the new data
      setTimeout(() => {
        window.print();
        loadData();
      }, 100);
    } catch (error) {
      console.error("Failed to print provisional invoice:", error);
      toast.error("Không thể tạo phiếu tạm tính");
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalPrice = orderItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0,
  );

  const discountedPrice = useMemo(() => {
    const discountAmount = (totalPrice * discountPercent) / 100;
    return totalPrice - discountAmount;
  }, [totalPrice, discountPercent]);

  const filteredProducts = products.filter(
    (p) =>
      p.isAvailable &&
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (selectedCategoryId === "ALL" ||
        p.categoryId === Number(selectedCategoryId)),
  );

  const filteredTables = useMemo(() => {
    let result = tables;

    if (statusFilter !== "ALL") {
      result = result.filter((t) => t.status === statusFilter);
    }

    if (selectedAreaId !== "ALL") {
      result = result.filter((t) => t.areaId === Number(selectedAreaId));
    }

    return result;
  }, [tables, statusFilter, selectedAreaId]);

  const getTableStatusColor = (status: TableStatus) => {
    switch (status) {
      case TableStatus.AVAILABLE:
        return "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 shadow-emerald-500/10";
      case TableStatus.OCCUPIED:
        return "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 shadow-amber-500/10";
      case TableStatus.RESERVED:
        return "bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 shadow-blue-500/10";
      default:
        return "bg-secondary";
    }
  };

  return (
    <PermissionGuard
      permissions={[Permission.ORDER_CREATE]}
      redirect="/dashboard"
    >
      <Card>
        <CardContent className="p-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h1 className="text-2xl font-bold tracking-wide text-[#00509E] dark:text-blue-400 uppercase">
              Gọi món tại bàn
            </h1>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
                  Khu vực:
                </span>
                <Select
                  value={selectedAreaId}
                  onValueChange={setSelectedAreaId}
                >
                  <SelectTrigger className="w-45 h-9">
                    <SelectValue placeholder="Tất cả khu vực" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Tất cả khu vực</SelectItem>
                    {areas.map((area) => (
                      <SelectItem key={area.id} value={area.id.toString()}>
                        {area.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant={statusFilter === "ALL" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("ALL")}
                  className="flex items-center gap-1"
                >
                  <Filter className="h-3.5 w-3.5" /> Tất cả
                </Button>
                <Button
                  variant={
                    statusFilter === TableStatus.AVAILABLE
                      ? "default"
                      : "outline"
                  }
                  size="sm"
                  onClick={() => setStatusFilter(TableStatus.AVAILABLE)}
                  className={cn(
                    "flex items-center gap-1",
                    statusFilter !== TableStatus.AVAILABLE &&
                      "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/20",
                  )}
                >
                  Trống (
                  {
                    tables.filter((t) => t.status === TableStatus.AVAILABLE)
                      .length
                  }
                  )
                </Button>
                <Button
                  variant={
                    statusFilter === TableStatus.OCCUPIED
                      ? "default"
                      : "outline"
                  }
                  size="sm"
                  onClick={() => setStatusFilter(TableStatus.OCCUPIED)}
                  className={cn(
                    "flex items-center gap-1",
                    statusFilter !== TableStatus.OCCUPIED &&
                      "bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 border-amber-500/20",
                  )}
                >
                  Đang ngồi (
                  {
                    tables.filter((t) => t.status === TableStatus.OCCUPIED)
                      .length
                  }
                  )
                </Button>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {filteredTables.map((table) => (
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
        </CardContent>
      </Card>

      {/* Order Dialog */}
      <Dialog open={isOrderDialogOpen} onOpenChange={setIsOrderDialogOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <ShoppingCart className="h-5 w-5" />
              {activeOrder ? "Chi tiết Đơn hàng" : "Gọi món"} cho{" "}
              {selectedTable?.tableNumber}
            </DialogTitle>
            <DialogDescription>
              {activeOrder
                ? "Xem các món đã gọi và thêm món mới vào đơn hàng."
                : "Chọn các món đồ uống từ thực đơn bên dưới để thêm vào giỏ hàng."}
            </DialogDescription>
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

              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
                  Danh mục:
                </span>
                <Select
                  value={selectedCategoryId}
                  onValueChange={setSelectedCategoryId}
                >
                  <SelectTrigger className="w-full h-9">
                    <SelectValue placeholder="Tất cả danh mục" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Tất cả danh mục</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <ScrollArea className="flex-1 pr-4">
                <div className="grid grid-cols-2 gap-3">
                  {filteredProducts.map((product) => (
                    <Card
                      key={product.id}
                      className="cursor-pointer hover:border-primary transition-colors flex flex-col overflow-hidden"
                      onClick={() => addToOrder(product)}
                    >
                      <div className="relative aspect-square bg-muted">
                        {product.imageUrl ? (
                          <Image
                            src={
                              product.imageUrl.startsWith("http")
                                ? product.imageUrl
                                : `${API_BASE_URL.replace("/api", "")}${product.imageUrl}`
                            }
                            alt={product.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <ImageOff className="h-8 w-8 text-muted-foreground/30" />
                          </div>
                        )}
                      </div>
                      <CardContent className="p-3">
                        <div className="font-semibold text-sm line-clamp-2 min-h-10">
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
                {activeOrder ? "Đơn hàng hiện tại" : "Đơn hàng mới"}
                <Badge className="bg-primary text-primary-foreground shadow-sm">
                  {orderItems.length} món
                </Badge>
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
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              {item.isExisting && (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] h-4 bg-muted text-muted-foreground border-border"
                                >
                                  Đã có
                                </Badge>
                              )}
                              <p className="font-medium text-sm truncate">
                                {item.product.name}
                              </p>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {new Intl.NumberFormat("vi-VN").format(
                                item.product.price,
                              )}
                              đ
                            </p>
                          </div>
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
                <div className="flex justify-between items-center font-bold text-lg mb-2">
                  <span>Tổng cộng:</span>
                  <span className="text-primary">
                    {new Intl.NumberFormat("vi-VN").format(totalPrice)}đ
                  </span>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Ghi chú đơn hàng
                  </Label>
                  <Textarea
                    placeholder="VD: Không lấy đường, nhiều đá..."
                    value={orderNote}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setOrderNote(e.target.value)
                    }
                    className="min-h-20 text-sm resize-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    className="w-full"
                    disabled={orderItems.length === 0 || isSubmitting}
                    onClick={() => handleSubmitOrder(false)}
                  >
                    Lưu đơn hàng
                  </Button>
                  <PermissionGuard permissions={[Permission.INVOICE_PAY]}>
                    <Button
                      className="w-full"
                      disabled={orderItems.length === 0 || isSubmitting}
                      onClick={() => {
                        setDiscountPercent(0);
                        handleSubmitOrder(true);
                      }}
                    >
                      Thanh toán
                    </Button>
                  </PermissionGuard>
                </div>

                <PermissionGuard permissions={[Permission.INVOICE_CREATE]}>
                  <Button
                    variant="secondary"
                    className="w-full bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200"
                    disabled={
                      (orderItems.length === 0 && !activeOrder) || isSubmitting
                    }
                    onClick={handlePrintProvisional}
                  >
                    <Printer className="mr-2 h-4 w-4" />
                    In phiếu tạm tính
                  </Button>
                </PermissionGuard>
                {activeOrder && (
                  <PermissionGuard permissions={[Permission.ORDER_DELETE]}>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                          disabled={isSubmitting}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Huỷ đơn hàng
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Xác nhận huỷ đơn hàng?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            Hành động này sẽ huỷ bỏ toàn bộ đơn hàng hiện tại
                            của bàn {selectedTable?.tableNumber} và trả bàn về
                            trạng thái trống. Bạn không thể hoàn tác hành động
                            này.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Bỏ qua</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleCancelOrder}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Xác nhận huỷ
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </PermissionGuard>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog
        open={isPaymentDialogOpen}
        onOpenChange={(open) => {
          if (!open && !isSubmitting) setIsPaymentDialogOpen(false);
        }}
      >
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto print:hidden">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">
              Thanh toán hóa đơn
            </DialogTitle>
            <DialogDescription className="text-center">
              Bàn {selectedTable?.tableNumber} -{" "}
              {new Date().toLocaleDateString("vi-VN")}
            </DialogDescription>
          </DialogHeader>

          {paymentSuccess ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-6">
              <div className="h-20 w-20 bg-emerald-500/20 rounded-full flex items-center justify-center">
                <Check className="h-10 w-10 text-emerald-500" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  Thanh toán thành công!
                </h3>
                <p className="text-muted-foreground">
                  Hoá đơn <strong>{lastInvoice?.invoiceNumber}</strong> đã được
                  quyết toán.
                </p>
              </div>
              <div className="flex gap-4 w-full max-w-sm pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setIsPaymentDialogOpen(false);
                    setPaymentSuccess(false);
                    setCreatedOrder(null);
                    setDiscountPercent(0);
                  }}
                >
                  Đóng
                </Button>
                <Button className="flex-1" onClick={handlePrint}>
                  <Printer className="mr-2 h-4 w-4" />
                  In hoá đơn
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
              {/* Payment Methods */}
              <div className="space-y-4">
                <h4 className="font-semibold text-sm uppercase text-muted-foreground">
                  Phương thức thanh toán
                </h4>
                <div className="grid gap-2">
                  <Button
                    variant={
                      paymentMethod === PaymentMethod.CASH
                        ? "default"
                        : "outline"
                    }
                    className="h-16 justify-start text-base"
                    onClick={() => setPaymentMethod(PaymentMethod.CASH)}
                  >
                    <Banknote className="mr-3 h-5 w-5 text-emerald-500" />
                    Tiền mặt
                  </Button>
                  <Button
                    variant={
                      paymentMethod === PaymentMethod.VNPAY
                        ? "default"
                        : "outline"
                    }
                    className="h-16 justify-start text-base border-blue-500/20"
                    onClick={() => setPaymentMethod(PaymentMethod.VNPAY)}
                  >
                    <div className="mr-3 h-6 w-8 bg-blue-600 rounded-sm flex items-center justify-center text-[10px] font-bold text-white">
                      VNPAY
                    </div>
                    Thanh toán VNPAY
                  </Button>
                  <Button
                    variant={
                      paymentMethod === PaymentMethod.MOMO
                        ? "default"
                        : "outline"
                    }
                    className="h-16 justify-start text-base border-pink-500/20"
                    onClick={() => setPaymentMethod(PaymentMethod.MOMO)}
                  >
                    <div className="mr-3 h-6 w-8 bg-[#A50064] rounded-sm flex items-center justify-center text-[10px] font-bold text-white">
                      MoMo
                    </div>
                    Thanh toán MoMo
                  </Button>
                </div>

                <div className="space-y-3 mt-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-sm uppercase text-muted-foreground">
                      Giảm giá hoá đơn (%)
                    </h4>
                    <Badge variant="outline" className="font-mono">
                      -{discountPercent}%
                    </Badge>
                  </div>
                  <div className="flex gap-1.5">
                    {[0, 5, 10, 15, 20, 50].map((val) => (
                      <Button
                        key={val}
                        variant={
                          discountPercent === val ? "default" : "outline"
                        }
                        size="sm"
                        className="flex-1 h-8 text-xs px-1"
                        onClick={() => setDiscountPercent(val)}
                      >
                        {val}%
                      </Button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      placeholder="Nhập % giảm..."
                      value={discountPercent || ""}
                      onChange={(e) =>
                        setDiscountPercent(
                          Math.min(100, Math.max(0, Number(e.target.value))),
                        )
                      }
                      className="h-9"
                    />
                  </div>
                </div>

                <div className="space-y-2 mt-4">
                  <h4 className="font-semibold text-sm uppercase text-muted-foreground">
                    Tổng hợp đơn hàng
                  </h4>
                  <div className="p-4 bg-muted rounded-lg border border-dashed space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Tạm tính:</span>
                      <span>
                        {new Intl.NumberFormat("vi-VN").format(totalPrice)}đ
                      </span>
                    </div>
                    {discountPercent > 0 && (
                      <div className="flex justify-between items-center text-sm text-destructive italic">
                        <span>Giảm giá ({discountPercent}%):</span>
                        <span>
                          -
                          {new Intl.NumberFormat("vi-VN").format(
                            (totalPrice * discountPercent) / 100,
                          )}
                          đ
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-center font-bold text-lg pt-2 border-t border-muted-foreground/20">
                      <span>Tổng cộng:</span>
                      <span className="text-primary">
                        {new Intl.NumberFormat("vi-VN").format(discountedPrice)}
                        đ
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Area */}
              <div className="flex flex-col gap-4">
                {paymentMethod === PaymentMethod.CASH && (
                  <div className="space-y-4">
                    <h4 className="font-semibold text-sm uppercase text-muted-foreground">
                      Bảng gợi ý tiền mặt
                    </h4>
                    <div className="grid grid-cols-3 gap-2">
                      {VN_DENOMINATIONS.map((den) => (
                        <Button
                          key={den}
                          variant="outline"
                          size="sm"
                          className={cn(
                            "text-xs h-10 font-bold border-none",
                            getDenominationStyle(den),
                          )}
                          onClick={() => setCashAmount((prev) => prev + den)}
                        >
                          {den >= 1000 ? den / 1000 : den}k
                        </Button>
                      ))}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs h-10 text-destructive border border-destructive/20"
                        onClick={() => setCashAmount(0)}
                      >
                        Reset
                      </Button>
                    </div>
                    <div className="space-y-2 p-4 bg-primary/5 rounded-lg border border-primary/20">
                      <div className="flex justify-between items-center text-sm">
                        <span>Khách đưa:</span>
                        <span className="font-bold">
                          {new Intl.NumberFormat("vi-VN").format(cashAmount)}đ
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-lg font-bold border-t pt-2 mt-2">
                        <span>Tiền thừa:</span>
                        <span className="text-emerald-500">
                          {new Intl.NumberFormat("vi-VN").format(
                            Math.max(0, cashAmount - discountedPrice),
                          )}
                          đ
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {paymentMethod === PaymentMethod.VNPAY && (
                  <div className="flex flex-col items-center justify-center p-8 bg-blue-500/10 rounded-lg border border-blue-500/20">
                    <div className="h-16 w-16 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl mb-4 shadow-sm">
                      VNP
                    </div>
                    <p className="text-sm font-medium text-blue-600 dark:text-blue-400 text-center">
                      Màn hình QR VNPAY sẽ hiển thị sau khi bạn bấm Xác nhận
                    </p>
                  </div>
                )}

                {paymentMethod === PaymentMethod.MOMO && (
                  <div className="flex flex-col items-center justify-center p-8 bg-pink-500/10 rounded-lg border border-pink-500/20">
                    <div className="h-16 w-16 bg-[#A50064] rounded-xl flex items-center justify-center text-white font-bold text-xl mb-4 shadow-sm">
                      MoMo
                    </div>
                    <p className="text-sm font-medium text-pink-600 dark:text-pink-400 text-center">
                      Màn hình QR MoMo sẽ hiển thị sau khi bạn bấm Xác nhận
                    </p>
                  </div>
                )}

                <div className="mt-auto pt-4 flex gap-2">
                  <Button
                    variant="ghost"
                    className="flex-1"
                    onClick={() => setIsPaymentDialogOpen(false)}
                    disabled={isSubmitting}
                  >
                    Hủy
                  </Button>
                  <PermissionGuard permissions={[Permission.INVOICE_PAY]}>
                    <Button
                      className="flex-2 hover:bg-primary/90"
                      disabled={
                        isSubmitting ||
                        (paymentMethod === PaymentMethod.CASH &&
                          cashAmount < totalPrice)
                      }
                      onClick={handleProcessPayment}
                    >
                      {isSubmitting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="mr-2 h-4 w-4" />
                      )}
                      Xác nhận thanh toán
                    </Button>
                  </PermissionGuard>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* VNPAY/MoMo QR Code Dialog */}
      <Dialog
        open={!!vnpayQrUrl || (isPaymentDialogOpen && paymentSuccess)}
        onOpenChange={(open) => {
          if (!open) {
            setVnpayQrUrl(null);
            setPendingInvoiceId(null);
            if (paymentSuccess) {
              setIsPaymentDialogOpen(false);
              setPaymentSuccess(false);
              setCreatedOrder(null);
              setDiscountPercent(0);
            }
          }
        }}
      >
        <DialogContent className="sm:max-w-md flex flex-col items-center justify-center p-6 text-center print:hidden">
          {paymentSuccess ? (
            <div className="py-6 flex flex-col items-center justify-center text-center space-y-6 w-full">
              <DialogHeader className="mb-0">
                <DialogTitle className="text-xl">
                  Thanh toán hóa đơn
                </DialogTitle>
                <DialogDescription>
                  Bàn {selectedTable?.tableNumber} -{" "}
                  {new Date().toLocaleDateString("vi-VN")}
                </DialogDescription>
              </DialogHeader>

              <div className="h-20 w-20 bg-emerald-500/20 rounded-full flex items-center justify-center my-2">
                <Check className="h-10 w-10 text-emerald-500" />
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  Thanh toán thành công!
                </h3>
                <p className="text-muted-foreground text-sm">
                  Hoá đơn <strong>{lastInvoice?.invoiceNumber}</strong> đã được
                  quyết toán.
                </p>
              </div>

              <div className="flex gap-4 w-full pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setVnpayQrUrl(null);
                    setIsPaymentDialogOpen(false);
                    setPaymentSuccess(false);
                    setCreatedOrder(null);
                    setDiscountPercent(0);
                  }}
                >
                  Đóng
                </Button>
                <Button className="flex-1" onClick={handlePrint}>
                  <Printer className="mr-2 h-4 w-4" />
                  In hoá đơn
                </Button>
              </div>
            </div>
          ) : (
            <>
              <DialogHeader className="mb-4">
                <DialogTitle className="text-xl">
                  Thanh toán{" "}
                  {paymentMethod === PaymentMethod.MOMO ? "MoMo" : "VNPAY"} QR
                </DialogTitle>
                <DialogDescription>
                  Mở ứng dụng{" "}
                  {paymentMethod === PaymentMethod.MOMO ? "MoMo" : "ngân hàng"}{" "}
                  để quét mã thanh toán.
                </DialogDescription>
              </DialogHeader>
              <div
                className={cn(
                  "p-4 rounded-xl border shadow-sm bg-white dark:bg-slate-900",
                  paymentMethod === PaymentMethod.MOMO
                    ? "border-pink-500/20"
                    : "border-blue-500/20",
                )}
              >
                {vnpayQrUrl && (
                  <QRCodeSVG
                    value={vnpayQrUrl}
                    size={256}
                    className="mx-auto"
                  />
                )}
              </div>
              <div className="mt-6 flex flex-col items-center gap-2">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <p className="text-sm font-medium text-muted-foreground animate-pulse">
                  Đang chờ khách thanh toán...
                </p>
              </div>
              <Button
                variant="outline"
                className="mt-4 w-full"
                onClick={() => {
                  setVnpayQrUrl(null);
                  setPendingInvoiceId(null);
                }}
              >
                Hủy chờ / Đóng
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>

      <PrintableInvoice ref={printRef} invoice={lastInvoice} />
    </PermissionGuard>
  );
}
