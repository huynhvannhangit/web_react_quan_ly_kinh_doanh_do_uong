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
} from "lucide-react";

export default function InvoicePage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Quản lý Hoá đơn</h1>
      </div>

      <Card>
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
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Chi tiết hoá đơn {selectedInvoice?.invoiceNumber}
            </DialogTitle>
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
                    {item.productName} x{item.quantity}
                  </span>
                  <span>
                    {new Intl.NumberFormat("vi-VN").format(item.totalPrice)}đ
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
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle className="text-center">
              Xác nhận thanh toán
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-4">
            <div className="text-center mb-4">
              <p className="text-sm text-muted-foreground">
                Số tiền cần thanh toán:
              </p>
              <p className="text-3xl font-bold text-primary">
                {new Intl.NumberFormat("vi-VN").format(
                  selectedInvoice?.total || 0,
                )}
                đ
              </p>
            </div>
            <Button
              className="h-14 justify-start text-base"
              variant="outline"
              disabled={processingPayment}
              onClick={() => handleProcessPayment(PaymentMethod.CASH)}
            >
              <Banknote className="mr-3 h-5 w-5 text-emerald-600" />
              Tiền mặt
            </Button>
            <Button
              className="h-14 justify-start text-base"
              variant="outline"
              disabled={processingPayment}
              onClick={() => handleProcessPayment(PaymentMethod.CARD)}
            >
              <CreditCard className="mr-3 h-5 w-5 text-blue-600" />
              Quẹt thẻ
            </Button>
            <Button
              className="h-14 justify-start text-base"
              variant="outline"
              disabled={processingPayment}
              onClick={() => handleProcessPayment(PaymentMethod.QR)}
            >
              <QrCode className="mr-3 h-5 w-5 text-amber-600" />
              Chuyển khoản / QR
            </Button>
          </div>
          {processingPayment && (
            <div className="flex items-center justify-center py-2">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              <span className="text-sm font-medium">Đang xử lý...</span>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
