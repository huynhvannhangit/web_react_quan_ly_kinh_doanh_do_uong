import api from "./api";

export interface Area {
  id: number;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export const areaService = {
  getAll: async () => {
    const response = await api.get<{ data: Area[] }>("/area");
    return response.data.data;
  },
  getOne: async (id: number) => {
    const response = await api.get<{ data: Area }>(`/area/${id}`);
    return response.data.data;
  },
  create: async (data: { name: string; description?: string }) => {
    const response = await api.post<{ data: Area }>("/area", data);
    return response.data.data;
  },
  update: async (id: number, data: { name?: string; description?: string }) => {
    const response = await api.patch<{ data: Area }>(`/area/${id}`, data);
    return response.data.data;
  },
  delete: async (id: number) => {
    const response = await api.delete<{ data: Area }>(`/area/${id}`);
    return response.data.data;
  },
};
