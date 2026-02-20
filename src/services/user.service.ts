import api from "./api";
import { Role } from "./role.service";

export interface User {
  id: number;
  email: string;
  fullName: string;
  role: Role | string;
  status: string;
  permissions?: any[];
}

export interface UpdateUserDto {
  roleId?: number;
  status?: string;
}

export const userService = {
  getAll: async () => {
    const response = await api.get<User[]>("/user");
    return response.data;
  },

  getOne: async (id: number) => {
    const response = await api.get<User>(`/user/${id}`);
    return response.data;
  },

  update: async (id: number, data: UpdateUserDto) => {
    const response = await api.patch<User>(`/user/${id}`, data);
    return response.data;
  },
};
