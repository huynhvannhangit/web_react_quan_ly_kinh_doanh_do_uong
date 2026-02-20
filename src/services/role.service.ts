import api from "./api";
import { Permission, ApiResponse } from "@/types";

export interface Role {
  id: number;
  name: string;
  description: string;
  permissions: Permission[];
  isActive: boolean;
}

export interface CreateRoleDto {
  name: string;
  description?: string;
  permissions: Permission[];
  isActive?: boolean;
}

export type UpdateRoleDto = Partial<CreateRoleDto>;

export const roleService = {
  getAll: async () => {
    const response = await api.get<ApiResponse<Role[]>>("/role");
    return response.data.data;
  },

  getOne: async (id: number) => {
    const response = await api.get<ApiResponse<Role>>(`/role/${id}`);
    return response.data.data;
  },

  create: async (data: CreateRoleDto) => {
    const response = await api.post<ApiResponse<Role>>("/role", data);
    return response.data.data;
  },

  update: async (id: number, data: UpdateRoleDto) => {
    const response = await api.patch<ApiResponse<Role>>(`/role/${id}`, data);
    return response.data.data;
  },

  delete: async (id: number) => {
    await api.delete<ApiResponse<void>>(`/role/${id}`);
  },
};
