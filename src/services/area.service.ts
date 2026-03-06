import api from "./api";

export interface Area {
  id: number;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  creator?: { id: number; fullName: string };
  updater?: { id: number; fullName: string };
}

export const areaService = {
  getAll: async (keyword?: string) => {
    const kw = keyword?.trim();
    const response = await api.get<{ data: Area[] }>("/area", {
      params: kw ? { keyword: kw } : {},
    });
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
  deleteMany: async (ids: number[], reason?: string) => {
    const response = await api.delete<{ data: Area[] }>("/area/bulk", {
      data: { ids, reason },
    });
    return response.data.data;
  },
};
