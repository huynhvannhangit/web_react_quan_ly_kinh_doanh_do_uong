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

export const areaService = {
  getAll: async () => {
    const response = await api.get<{ data: Area[] }>("/area");
    return response.data.data;
  },
  create: async (data: { name: string; description?: string }) => {
    const response = await api.post<{ data: Area }>("/area", data);
    return response.data.data;
  },
};

export const tableService = {
  getAll: async () => {
    const response = await api.get<{ data: Table[] }>("/table");
    return response.data.data;
  },
  create: async (
    data: Omit<Table, "id" | "createdAt" | "updatedAt" | "area">,
  ) => {
    const response = await api.post<{ data: Table }>("/table", data);
    return response.data.data;
  },
};
