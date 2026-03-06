import api from "./api";
import { Table as TableType } from "./table.service";
import { Order } from "./order.service";

export enum InvoiceStatus {
  PENDING = "PENDING",
  PAID = "PAID",
  CANCELLED = "CANCELLED",
}

export enum PaymentMethod {
  CASH = "CASH",
  CARD = "CARD",
  QR = "QR",
  VNPAY = "VNPAY",
  MOMO = "MOMO",
}

export interface InvoiceItem {
  id: number;
  productName?: string;
  product?: {
    id: number;
    name: string;
    price: number;
  };
  quantity: number;
  price: number;
  totalPrice?: number;
  total?: number;
}

export interface Invoice {
  id: number;
  invoiceNumber: string;
  table?: TableType;
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  total: number;
  status: InvoiceStatus;
  paymentMethod?: PaymentMethod;
  paidAt?: string;
  items: InvoiceItem[];
  orderId?: number;
  order?: Order;
  createdAt: string;
}

export interface CreateInvoiceDto {
  orderId: number;
  discountPercent?: number;
}

export interface ProcessPaymentDto {
  paymentMethod: PaymentMethod;
}

export const invoiceService = {
  getAll: async (keyword?: string) => {
    const kw = keyword?.trim();
    const response = await api.get<{ data: Invoice[] }>("/invoice", {
      params: kw ? { keyword: kw } : {},
    });
    return response.data.data;
  },

  getById: async (id: number) => {
    const response = await api.get<{ data: Invoice }>(`/invoice/${id}`);
    return response.data.data;
  },

  createFromOrder: async (data: CreateInvoiceDto) => {
    const response = await api.post<{ data: Invoice }>("/invoice", data);
    return response.data.data;
  },

  processPayment: async (id: number, data: ProcessPaymentDto) => {
    const response = await api.post<{ data: Invoice }>(
      `/invoice/${id}/pay`,
      data,
    );
    return response.data.data;
  },

  cancel: async (id: number) => {
    const response = await api.post<{ data: Invoice }>(
      `/invoice/${id}/cancel`,
      {},
    );
    return response.data.data;
  },
};
