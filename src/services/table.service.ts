import api from "./api";

export enum TableStatus {
  AVAILABLE = "AVAILABLE",
  OCCUPIED = "OCCUPIED",
  RESERVED = "RESERVED",
}

export interface Area {
  id: number;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Table {
  id: number;
  tableNumber: string;
  capacity: number;
  status: TableStatus;
  areaId: number;
  area?: Area;
  createdAt: string;
  updatedAt: string;
}

export const tableService = {
  getAll: async () => {
    const response = await api.get<{ data: Table[] }>("/table");
    return response.data.data;
  },
  getOne: async (id: number) => {
    const response = await api.get<{ data: Table }>(`/table/${id}`);
    return response.data.data;
  },
  create: async (
    data: Omit<Table, "id" | "createdAt" | "updatedAt" | "area">,
  ) => {
    const response = await api.post<{ data: Table }>("/table", data);
    return response.data.data;
  },
  update: async (
    id: number,
    data: Partial<Omit<Table, "id" | "createdAt" | "updatedAt" | "area">>,
  ) => {
    const response = await api.patch<{ data: Table }>(`/table/${id}`, data);
    return response.data.data;
  },
  delete: async (id: number) => {
    const response = await api.delete<{ data: Table }>(`/table/${id}`);
    return response.data.data;
  },
};
