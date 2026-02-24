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
  CreditCard,
  Banknote,
  QrCode,
  Eye,
  CheckCircle2,
  Loader2,
  FileText,
  Printer,
} from "lucide-react";
import { PrintableInvoice } from "@/components/invoice/PrintableInvoice";
import { useRef } from "react";
import { Permission } from "@/types";
import { PermissionGuard } from "@/components/shared/PermissionGuard";

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

  const loadInvoices = async () => {
    try {
      const data = await invoiceService.getAll();
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
      await invoiceService.processPayment(selectedInvoice.id, {
        paymentMethod: method,
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
        return <Badge variant="secondary">Đã hủy</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getMethodIcon = (method?: PaymentMethod) => {
    switch (method) {
      case PaymentMethod.CASH:
        return <Banknote className="h-4 w-4 mr-2" />;
      case PaymentMethod.CARD:
        return <CreditCard className="h-4 w-4 mr-2" />;
      case PaymentMethod.QR:
        return <QrCode className="h-4 w-4 mr-2" />;
      default:
        return null;
    }
  };

  const getMethodLabel = (method?: PaymentMethod) => {
    switch (method) {
      case PaymentMethod.CASH:
        return "Tiền mặt";
      case PaymentMethod.CARD:
        return "Thẻ";
      case PaymentMethod.QR:
        return "Chuyển khoản / QR";
      default:
        return "—";
    }
  };

  return (
    <PermissionGuard
      permissions={[Permission.INVOICE_VIEW]}
      redirect="/dashboard"
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between print:hidden">
          <h1 className="text-2xl font-bold tracking-tight">Quản lý Hoá đơn</h1>
        </div>

        <Card className="print:hidden">
          <CardHeader>
            <CardTitle>Danh sách hoá đơn</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Số HĐ</TableHead>
                  <TableHead>Bàn</TableHead>
                  <TableHead>Tổng tiền</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Thanh toán</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                    </TableCell>
                  </TableRow>
                ) : invoices.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-8 text-muted-foreground"
                    >
                      Chưa có hoá đơn nào
                    </TableCell>
                  </TableRow>
                ) : (
                  invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-mono font-bold text-xs uppercase">
                        {invoice.invoiceNumber}
                      </TableCell>
                      <TableCell>
                        Bàn {invoice.table?.tableNumber || "K/X"}
                      </TableCell>
                      <TableCell className="font-bold text-primary">
                        {new Intl.NumberFormat("vi-VN").format(invoice.total)}đ
                      </TableCell>
                      <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center text-sm">
                          {getMethodIcon(invoice.paymentMethod)}
                          {getMethodLabel(invoice.paymentMethod)}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(invoice.createdAt).toLocaleString("vi-VN")}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleViewDetail(invoice)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {invoice.status === InvoiceStatus.PENDING && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-emerald-600"
                            onClick={() => handleOpenPayment(invoice)}
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-primary"
                          onClick={() => handlePrint(invoice)}
                        >
                          <Printer className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
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
                Xem thông tin chi tiết về các món đã dùng, tổng tiền và trạng
                thái thanh toán của hoá đơn này.
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
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto print:hidden">
            <DialogHeader>
              <DialogTitle className="text-center text-xl">
                Thanh toán hóa đơn
              </DialogTitle>
              <DialogDescription className="text-center">
                Chọn phương thức thanh toán phù hợp để hoàn tất giao dịch cho
                hoá đơn này.
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
                      paymentMethod === PaymentMethod.QR ? "default" : "outline"
                    }
                    className="h-16 justify-start text-base"
                    onClick={() => setPaymentMethod(PaymentMethod.QR)}
                  >
                    <QrCode className="mr-3 h-5 w-5 text-amber-500" />
                    Chuyển khoản / QR
                  </Button>
                  <Button
                    variant={
                      paymentMethod === PaymentMethod.CARD
                        ? "default"
                        : "outline"
                    }
                    className="h-16 justify-start text-base"
                    onClick={() => setPaymentMethod(PaymentMethod.CARD)}
                  >
                    <CreditCard className="mr-3 h-5 w-5 text-blue-500" />
                    Thẻ ngân hàng
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

                {paymentMethod === PaymentMethod.QR && (
                  <div className="flex flex-col items-center justify-center p-6 bg-white rounded-lg border space-y-4">
                    <h4 className="font-semibold text-sm text-center">
                      Quét mã để thanh toán VNPay/Momo
                    </h4>
                    <div className="relative h-40 w-40 bg-muted flex items-center justify-center border-2 border-primary/20 p-2 rounded-xl">
                      <QrCode className="h-24 w-24 text-primary opacity-80" />
                      <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-[1px] opacity-0 hover:opacity-100 transition-opacity">
                        <span className="text-xs font-bold text-primary">
                          QR MÔ PHỎNG
                        </span>
                      </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground text-center">
                      Sử dụng ứng dụng ngân hàng hoặc ví điện tử để quét
                    </p>
                  </div>
                )}

                {paymentMethod === PaymentMethod.CARD && (
                  <div className="flex flex-col items-center justify-center p-8 bg-slate-50 rounded-lg border border-slate-200">
                    <CreditCard className="h-16 w-16 text-slate-400 mb-4" />
                    <p className="text-sm font-medium text-slate-600 text-center">
                      Vui lòng sử dụng máy quẹt thẻ POS
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
      </div>
    </PermissionGuard>
  );
}
