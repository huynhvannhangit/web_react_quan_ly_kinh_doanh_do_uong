"use client";

import React from "react";
import { Invoice, InvoiceItem } from "@/services/invoice.service";
import { useAuth, AuthUser } from "@/components/providers/auth-provider";

interface PrintableInvoiceProps {
  invoice: Invoice | null;
}

export const PrintableInvoice = React.forwardRef<
  HTMLDivElement,
  PrintableInvoiceProps
>(({ invoice }, ref) => {
  const { user } = useAuth() as { user: AuthUser | null };

  if (!invoice) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN").format(amount) + "đ";
  };

  return (
    <div className="printable-area print:visible flex justify-center">
      <div
        ref={ref}
        className="w-[80mm] p-6 bg-white font-mono text-[13px] leading-relaxed text-black shadow-sm"
      >
        {/* Header */}
        <div className="text-center space-y-1 mb-6 text-black">
          <h1 className="text-[20px] font-bold uppercase text-black tracking-wider">
            HVN COFFEE
          </h1>
          <p className="text-[11px] text-black">
            123 Đường Nam Kỳ Khởi Nghĩa, Cần Thơ
          </p>
          <p className="text-[11px] text-black font-bold">
            Hotline: 0866875314
          </p>
        </div>

        <div className="border-t border-b border-black border-dashed py-3 mb-6 space-y-1.5 text-black">
          <div className="flex justify-between text-black">
            <span>Số HĐ:</span>
            <span className="font-bold">{invoice.invoiceNumber}</span>
          </div>
          <div className="flex justify-between text-black">
            <span>Bàn:</span>
            <span className="font-bold">
              {invoice.table?.tableNumber || "K/X"}
            </span>
          </div>
          <div className="flex justify-between text-black">
            <span>Nhân viên:</span>
            <span>{user?.fullName || "Admin"}</span>
          </div>
          <div className="flex justify-between text-black">
            <span>Ngày:</span>
            <span>{new Date(invoice.createdAt).toLocaleString("vi-VN")}</span>
          </div>
          {invoice.paymentMethod && (
            <div className="flex justify-between text-black">
              <span>Hình thức:</span>
              <span className="font-bold">{invoice.paymentMethod}</span>
            </div>
          )}
        </div>

        {/* Items */}
        <table className="w-full mb-6 text-black border-collapse">
          <thead>
            <tr className="border-b border-black">
              <th className="text-left py-2 w-[45%] text-black uppercase text-[11px]">
                Món
              </th>
              <th className="text-center py-2 text-black uppercase text-[11px]">
                SL
              </th>
              <th className="text-right py-2 text-black uppercase text-[11px]">
                Tiền
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/10">
            {invoice.items.map((item: InvoiceItem, idx: number) => (
              <tr key={idx}>
                <td className="py-2.5 text-black leading-tight">
                  {item.productName || item.product?.name}
                </td>
                <td className="text-center py-2.5 text-black">
                  {item.quantity}
                </td>
                <td className="text-right py-2.5 text-black font-medium">
                  {formatCurrency(item.totalPrice || item.total || 0)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Summary */}
        <div className="space-y-2 mb-8 text-black border-t border-black pt-3">
          <div className="flex justify-between text-black">
            <span>Tạm tính:</span>
            <span>{formatCurrency(invoice.subtotal)}</span>
          </div>
          {invoice.discountAmount > 0 && (
            <div className="flex justify-between text-black italic">
              <span>Giảm giá ({invoice.discountPercent}%):</span>
              <span>-{formatCurrency(invoice.discountAmount)}</span>
            </div>
          )}
          <div className="flex justify-between text-[16px] font-bold pt-1 text-black">
            <span>THÀNH TIỀN:</span>
            <span>{formatCurrency(invoice.total)}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center space-y-2 mt-10 text-black border-t border-black border-dotted pt-6">
          <p className="font-bold italic text-black text-[14px]">
            Hẹn gặp lại quý khách!
          </p>
          <p className="text-[11px] text-black">
            Chúc quý khách một ngày vui vẻ
          </p>
          <div className="mt-4 font-bold text-[11px] text-black pt-2 uppercase">
            wifi: HVN COFFEE
          </div>
          <div className="text-[11px] text-black">password: 68686868</div>
        </div>
      </div>
    </div>
  );
});

PrintableInvoice.displayName = "PrintableInvoice";
