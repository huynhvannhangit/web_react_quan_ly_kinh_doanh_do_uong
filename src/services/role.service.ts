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

  create: async (data: CreateRoleDto, reason?: string) => {
    const response = await api.post<ApiResponse<Role>>("/role", {
      ...data,
      reason,
    });
    return response.data.data;
  },

  update: async (id: number, data: UpdateRoleDto, reason?: string) => {
    const response = await api.patch<ApiResponse<Role>>(`/role/${id}`, {
      ...data,
      reason,
    });
    return response.data.data;
  },

  delete: async (id: number, reason?: string) => {
    await api.delete<ApiResponse<void>>(`/role/${id}`, { data: { reason } });
  },
};
