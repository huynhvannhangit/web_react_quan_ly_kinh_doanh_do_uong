"use client";

import React, { useEffect, useState } from "react";
import {
  invoiceService,
  Invoice,
  InvoiceStatus,
  PaymentMethod,
} from "@/services/invoice.service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Banknote,
  Eye,
  CheckCircle2,
  Loader2,
  FileText,
  Printer,
  Search,
  RotateCcw,
  XCircle,
} from "lucide-react";
import { PrintableInvoice } from "@/components/invoice/PrintableInvoice";
import { useRef } from "react";
import { Permission } from "@/types";
import { PermissionGuard } from "@/components/shared/PermissionGuard";
import { Pagination } from "@/components/shared/Pagination";
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
} from "@/components/ui/alert-dialog";

export default function InvoicePage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    PaymentMethod.CASH,
  );
  const [cashAmount, setCashAmount] = useState<number>(0);
  const printRef = useRef<HTMLDivElement>(null);
  const [invoiceToPrint, setInvoiceToPrint] = useState<Invoice | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [invoiceToCancel, setInvoiceToCancel] = useState<Invoice | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const pageSize = 10;

  const VN_DENOMINATIONS = [
    500000, 200000, 100000, 50000, 20000, 10000, 5000, 2000, 1000,
  ];

  const getDenominationStyle = (den: number) => {
    switch (den) {
      case 500000:
        return "bg-[#006E8C] text-white hover:bg-[#005a73] shadow-inner";
      case 200000:
        return "bg-[#B34D26] text-white hover:bg-[#943f1f] shadow-inner";
      case 100000:
        return "bg-[#5D8233] text-white hover:bg-[#4d6b2a] shadow-inner";
      case 50000:
        return "bg-[#A3527D] text-white hover:bg-[#854366] shadow-inner";
      case 20000:
        return "bg-[#2D4B73] text-white hover:bg-[#253e5f] shadow-inner";
      case 10000:
        return "bg-[#967B4F] text-white hover:bg-[#7a6440] shadow-inner";
      default:
        return "bg-slate-500 text-white hover:bg-slate-600 shadow-inner";
    }
  };

  const cn = (...classes: (string | boolean | undefined)[]) =>
    classes.filter(Boolean).join(" ");

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async (keyword?: string) => {
    try {
      const data = await invoiceService.getAll(keyword);
      setInvoices(data);
    } catch (error) {
      console.error("Failed to load invoices:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetail = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsDetailDialogOpen(true);
  };

  const handleOpenPayment = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setCashAmount(0);
    setPaymentMethod(PaymentMethod.CASH);
    setIsPaymentDialogOpen(true);
  };

  const handleProcessPayment = async (method: PaymentMethod) => {
    if (!selectedInvoice) return;

    setProcessingPayment(true);
    try {
      const requestedChange = Math.max(0, cashAmount - (selectedInvoice.total || 0));
      await invoiceService.processPayment(selectedInvoice.id, {
        paymentMethod: method,
        receivedAmount: method === PaymentMethod.CASH ? cashAmount : 0,
        changeAmount: method === PaymentMethod.CASH ? requestedChange : 0,
      });
      setIsPaymentDialogOpen(false);
      loadInvoices();
    } catch (error) {
      console.error("Payment failed:", error);
    } finally {
      setProcessingPayment(false);
    }
  };

  const handlePrint = (invoice: Invoice) => {
    setInvoiceToPrint(invoice);
    // Give it a tick to render if it was null
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const handleOpenCancel = (invoice: Invoice) => {
    setInvoiceToCancel(invoice);
    setIsCancelDialogOpen(true);
  };

  const handleCancelInvoice = async () => {
    if (!invoiceToCancel) return;

    setIsCancelling(true);
    try {
      await invoiceService.cancel(invoiceToCancel.id);
      toast.success("Hủy hóa đơn thành công");
      setIsCancelDialogOpen(false);
      loadInvoices();
    } catch (error) {
      console.error("Cancel invoice failed:", error);
      toast.error("Hủy hóa đơn thất bại");
    } finally {
      setIsCancelling(false);
    }
  };

  const getStatusBadge = (status: InvoiceStatus) => {
    switch (status) {
      case InvoiceStatus.PENDING:
        return (
          <Badge
            variant="outline"
            className="bg-amber-50 text-amber-700 border-amber-200"
          >
            Chờ thanh toán
          </Badge>
        );
      case InvoiceStatus.PAID:
        return (
          <Badge
            variant="outline"
            className="bg-emerald-50 text-emerald-700 border-emerald-200"
          >
            Đã thanh toán
          </Badge>
        );
      case InvoiceStatus.CANCELLED:
        return (
          <Badge
            variant="outline"
            className="bg-rose-50 text-rose-700 border-rose-200"
          >
            Đã hủy
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const filteredInvoices = invoices;
  const totalPages = Math.ceil(filteredInvoices.length / pageSize);
  const paginatedInvoices = filteredInvoices.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  const globalOffset = (currentPage - 1) * pageSize;

  const getMethodIcon = (method?: PaymentMethod) => {
    switch (method) {
      case PaymentMethod.CASH:
        return <Banknote className="h-4 w-4 mr-2" />;
      case PaymentMethod.VNPAY:
        return (
          <div className="mr-2 h-4 w-6 bg-blue-600 rounded-[2px] flex items-center justify-center text-[7px] font-bold text-white">
            VNP
          </div>
        );
      case PaymentMethod.MOMO:
        return (
          <div className="mr-2 h-4 w-6 bg-pink-500 rounded-[2px] flex items-center justify-center text-[7px] font-bold text-white">
            MM
          </div>
        );
      default:
        return null;
    }
  };

  const getMethodLabel = (method?: PaymentMethod) => {
    switch (method) {
      case PaymentMethod.CASH:
        return "Tiền mặt";
      case PaymentMethod.VNPAY:
        return "VNPAY";
      case PaymentMethod.MOMO:
        return "MoMo";
      default:
        return "—";
    }
  };

  return (
    <PermissionGuard
      permissions={[Permission.INVOICE_VIEW]}
      redirect="/dashboard"
    >
      <Card>
        <CardContent className="p-8 space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold tracking-wide text-[#00509E] dark:text-blue-400 uppercase">
              Quản lý Hoá đơn
            </h1>
          </div>

          <div className="flex flex-wrap items-end justify-between mt-6 w-full gap-4">
            <div className="hidden lg:block lg:flex-1" />

            <div className="flex flex-col gap-1 w-full max-w-150">
              <label className="text-xs text-muted-foreground text-left">
                Mã hóa đơn
              </label>
              <Input
                placeholder="Tìm kiếm..."
                className="bg-background border-border rounded-lg h-10 w-full"
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setSearchTerm(e.target.value)
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setCurrentPage(1);
                    loadInvoices(searchTerm);
                  }
                }}
              />
            </div>

            <div className="flex-1 flex justify-end items-end gap-2 mb-0.5 min-w-fit">
              <Button
                onClick={() => {
                  setCurrentPage(1);
                  loadInvoices(searchTerm);
                }}
                className="gap-2 bg-[#00509E] hover:bg-[#00509E]/90 text-white rounded-lg"
              >
                <Search className="h-4 w-4" />
                Tìm kiếm
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setCurrentPage(1);
                  loadInvoices();
                }}
                className="gap-2 rounded-lg"
              >
                <RotateCcw className="h-4 w-4" />
                Làm mới
              </Button>
            </div>
          </div>

          <Card className="border-none shadow-none">
            <CardHeader className="flex flex-row items-center justify-between pb-4 px-0">
              <CardTitle className="text-lg font-semibold text-foreground">
                Danh sách hoá đơn
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0">
              <div className="overflow-x-auto [&_th]:bg-muted [&_th]:text-muted-foreground [&_th]:font-semibold [&_td]:py-4">
                <Table className="min-w-325 font-sans">
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-border">
                      <TableHead className="w-12 text-center whitespace-nowrap">
                        STT
                      </TableHead>
                      <TableHead className="whitespace-nowrap">Số HĐ</TableHead>
                      <TableHead className="whitespace-nowrap">Bàn</TableHead>
                      <TableHead className="whitespace-nowrap">
                        Tổng tiền
                      </TableHead>
                      <TableHead className="whitespace-nowrap">
                        Trạng thái
                      </TableHead>
                      <TableHead className="whitespace-nowrap">
                        Thanh toán
                      </TableHead>
                      <TableHead className="whitespace-nowrap">
                        Người tạo
                      </TableHead>
                      <TableHead className="whitespace-nowrap">
                        Ngày tạo
                      </TableHead>
                      <TableHead className="text-right whitespace-nowrap">
                        Thao tác
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-12">
                          <div className="flex flex-col items-center gap-2 text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Đang tải...
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : filteredInvoices.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="text-center py-12 text-muted-foreground"
                        >
                          {searchTerm
                            ? "Không tìm thấy hóa đơn phù hợp"
                            : "Chưa có hoá đơn nào"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedInvoices.map((invoice, index) => (
                        <TableRow
                          key={invoice.id}
                          className="hover:bg-muted/50 transition-colors border-border"
                        >
                          <TableCell className="text-center font-medium text-slate-500 whitespace-nowrap">
                            {globalOffset + index + 1}
                          </TableCell>
                          <TableCell className="font-mono font-bold text-xs uppercase text-foreground whitespace-nowrap">
                            {invoice.invoiceNumber}
                          </TableCell>
                          <TableCell className="text-muted-foreground whitespace-nowrap">
                            Bàn {invoice.table?.tableNumber || "K/X"}
                          </TableCell>
                          <TableCell className="font-bold text-primary whitespace-nowrap">
                            {new Intl.NumberFormat("vi-VN").format(
                              invoice.total,
                            )}
                            đ
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {getStatusBadge(invoice.status)}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <div className="flex items-center text-sm">
                              {getMethodIcon(invoice.paymentMethod)}
                              {getMethodLabel(invoice.paymentMethod)}
                            </div>
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-muted-foreground text-[13px]">
                            {invoice.creator?.fullName ||
                              invoice.updater?.fullName ||
                              "—"}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(invoice.createdAt).toLocaleString(
                              "vi-VN",
                            )}
                          </TableCell>
                          <TableCell className="text-right whitespace-nowrap">
                            <PermissionGuard
                              permissions={[Permission.INVOICE_VIEW]}
                            >
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleViewDetail(invoice)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </PermissionGuard>
                            {invoice.status === InvoiceStatus.PENDING && (
                              <PermissionGuard
                                permissions={[Permission.INVOICE_PAY]}
                              >
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-emerald-600"
                                  onClick={() => handleOpenPayment(invoice)}
                                >
                                  <CheckCircle2 className="h-4 w-4" />
                                </Button>
                              </PermissionGuard>
                            )}
                            <PermissionGuard
                              permissions={[Permission.INVOICE_VIEW]}
                            >
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-primary hover:text-primary hover:bg-primary/10"
                                onClick={() => handlePrint(invoice)}
                              >
                                <Printer className="h-4 w-4" />
                              </Button>
                            </PermissionGuard>
                            {invoice.status !== InvoiceStatus.CANCELLED && (
                              <PermissionGuard
                                permissions={[Permission.INVOICE_CANCEL]}
                              >
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                  onClick={() => handleOpenCancel(invoice)}
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </PermissionGuard>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filteredInvoices.length}
                onPageChange={setCurrentPage}
              />
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      <PrintableInvoice ref={printRef} invoice={invoiceToPrint} />

      {/* Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Chi tiết hoá đơn {selectedInvoice?.invoiceNumber}
            </DialogTitle>
            <DialogDescription>
              Xem thông tin chi tiết về các món đã dùng, tổng tiền và trạng thái
              thanh toán của hoá đơn này.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Bàn:</span>
              <span className="font-bold">
                Bàn {selectedInvoice?.table?.tableNumber}
              </span>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-bold uppercase text-muted-foreground">
                Danh sách món:
              </p>
              {selectedInvoice?.items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span>
                    {item.productName || item.product?.name} x{item.quantity}
                  </span>
                  <span>
                    {new Intl.NumberFormat("vi-VN").format(
                      item.totalPrice || item.total || 0,
                    )}
                    đ
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t space-y-1">
              <div className="flex justify-between text-sm">
                <span>Tạm tính:</span>
                <span>
                  {new Intl.NumberFormat("vi-VN").format(
                    selectedInvoice?.subtotal || 0,
                  )}
                  đ
                </span>
              </div>
              <div className="flex justify-between text-sm text-rose-600">
                <span>Giảm giá ({selectedInvoice?.discountPercent}%):</span>
                <span>
                  -
                  {new Intl.NumberFormat("vi-VN").format(
                    selectedInvoice?.discountAmount || 0,
                  )}
                  đ
                </span>
              </div>
              <div className="flex justify-between text-lg font-bold text-primary mt-2 pt-2 border-t">
                <span>Tổng cộng:</span>
                <span>
                  {new Intl.NumberFormat("vi-VN").format(
                    selectedInvoice?.total || 0,
                  )}
                  đ
                </span>
              </div>
              {selectedInvoice?.status === InvoiceStatus.PAID &&
                selectedInvoice?.paymentMethod === PaymentMethod.CASH && (
                  <div className="space-y-1 pt-2 border-t border-dotted mt-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Khách đưa:</span>
                      <span className="font-medium">
                        {new Intl.NumberFormat("vi-VN").format(
                          selectedInvoice?.receivedAmount || 0,
                        )}
                        đ
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tiền thừa:</span>
                      <span className="font-medium text-emerald-600">
                        {new Intl.NumberFormat("vi-VN").format(
                          selectedInvoice?.changeAmount || 0,
                        )}
                        đ
                      </span>
                    </div>
                  </div>
                )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDetailDialogOpen(false)}
            >
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog
        open={isPaymentDialogOpen}
        onOpenChange={(open) => {
          if (!open && !processingPayment) setIsPaymentDialogOpen(false);
        }}
      >
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto print:hidden">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">
              Thanh toán hóa đơn
            </DialogTitle>
            <DialogDescription className="text-center">
              Chọn phương thức thanh toán phù hợp để hoàn tất giao dịch cho hoá
              đơn này.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
            {/* Payment Methods */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm uppercase text-muted-foreground">
                Phương thức thanh toán
              </h4>
              <div className="grid gap-2">
                <Button
                  variant={
                    paymentMethod === PaymentMethod.CASH ? "default" : "outline"
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
                  className="h-16 justify-start text-base border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                  onClick={() => setPaymentMethod(PaymentMethod.VNPAY)}
                >
                  <div className="mr-3 h-6 w-8 bg-blue-600 rounded-[2px] flex items-center justify-center text-[10px] font-bold text-white">
                    VNPAY
                  </div>
                  Thanh toán VNPAY
                </Button>
                <Button
                  variant={
                    paymentMethod === PaymentMethod.MOMO ? "default" : "outline"
                  }
                  className="h-16 justify-start text-base border-pink-200 hover:bg-pink-50 hover:text-pink-700"
                  onClick={() => setPaymentMethod(PaymentMethod.MOMO)}
                >
                  <div className="mr-3 h-6 w-8 bg-[#A50064] rounded-[2px] flex items-center justify-center text-[10px] font-bold text-white">
                    MoMo
                  </div>
                  Thanh toán MoMo
                </Button>
              </div>

              <div className="p-4 bg-muted rounded-lg border border-dashed border-muted-foreground/30">
                <div className="flex justify-between items-center font-bold text-lg">
                  <span>Số tiền cần trả:</span>
                  <span className="text-primary">
                    {new Intl.NumberFormat("vi-VN").format(
                      selectedInvoice?.total || 0,
                    )}
                    đ
                  </span>
                </div>
              </div>
            </div>

            {/* Action Area */}
            <div className="flex flex-col gap-4">
              {paymentMethod === PaymentMethod.CASH && (
                <div className="space-y-4">
                  <h4 className="font-semibold text-sm uppercase text-muted-foreground">
                    Bảng tính tiền mặt (VNĐ)
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
                      <span className="text-emerald-600">
                        {new Intl.NumberFormat("vi-VN").format(
                          Math.max(
                            0,
                            cashAmount - (selectedInvoice?.total || 0),
                          ),
                        )}
                        đ
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {paymentMethod === PaymentMethod.VNPAY && (
                <div className="flex flex-col items-center justify-center p-8 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="h-16 w-16 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl mb-4 shadow-sm">
                    VNP
                  </div>
                  <p className="text-sm font-medium text-blue-800 text-center">
                    Hệ thống sẽ cập nhật trạng thái tự động sau khi khách quét
                    mã
                  </p>
                </div>
              )}

              {paymentMethod === PaymentMethod.MOMO && (
                <div className="flex flex-col items-center justify-center p-8 bg-pink-50 rounded-lg border border-pink-200">
                  <div className="h-16 w-16 bg-[#A50064] rounded-xl flex items-center justify-center text-white font-bold text-xl mb-4 shadow-sm">
                    MoMo
                  </div>
                  <p className="text-sm font-medium text-pink-800 text-center">
                    Màn hình mã QR MoMo sẽ hiển thị để khách hàng quét thanh
                    toán
                  </p>
                </div>
              )}

              <div className="mt-auto pt-4 flex gap-2">
                <Button
                  variant="ghost"
                  className="flex-1"
                  onClick={() => setIsPaymentDialogOpen(false)}
                  disabled={processingPayment}
                >
                  Hủy
                </Button>
                <Button
                  className="flex-2 hover:bg-primary/90"
                  disabled={
                    processingPayment ||
                    (paymentMethod === PaymentMethod.CASH &&
                      cashAmount < (selectedInvoice?.total || 0))
                  }
                  onClick={() => handleProcessPayment(paymentMethod)}
                >
                  {processingPayment ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                  )}
                  Xác nhận thanh toán
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog
        open={isCancelDialogOpen}
        onOpenChange={setIsCancelDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận hủy hóa đơn?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này sẽ chuyển trạng thái hóa đơn thành &quot;Đã
              hủy&quot; và không thể phục hồi. Bàn liên quan (nếu có) sẽ được
              chuyển về trạng thái &quot;Trống&quot;.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCancelling}>Đóng</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelInvoice}
              disabled={isCancelling}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isCancelling ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <XCircle className="mr-2 h-4 w-4" />
              )}
              Xác nhận hủy
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PermissionGuard>
  );
}
