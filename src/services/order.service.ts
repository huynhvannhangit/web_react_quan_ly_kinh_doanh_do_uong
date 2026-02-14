import api from "./api";
import { Product } from "./product.service";
import { Table as TableType } from "./table.service";

export enum OrderStatus {
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export interface OrderItem {
  id: number;
  productId: number;
  product?: Product;
  quantity: number;
  price: number;
  notes?: string;
}

export interface Order {
  id: number;
  orderNumber: string;
  totalPrice: number;
  status: OrderStatus;
  notes?: string;
  tableId?: number;
  table?: TableType;
  items: OrderItem[];
  createdAt: string;
}

export interface CreateOrderDto {
  tableId?: number;
  notes?: string;
  items: {
    productId: number;
    quantity: number;
    price: number;
    notes?: string;
  }[];
  status?: OrderStatus;
}

export const orderService = {
  getAll: async () => {
    const response = await api.get<{ data: Order[] }>("/order");
    return response.data.data;
  },

  getById: async (id: number) => {
    const response = await api.get<{ data: Order }>(`/order/${id}`);
    return response.data.data;
  },

  create: async (data: CreateOrderDto) => {
    const response = await api.post<{ data: Order }>("/order", data);
    return response.data.data;
  },

  updateStatus: async (id: number, status: OrderStatus) => {
    const response = await api.patch<{ data: Order }>(`/order/${id}/status`, {
      status,
    });
    return response.data.data;
  },

  delete: async (id: number) => {
    await api.delete(`/order/${id}`);
  },
};
