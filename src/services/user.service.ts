import api from "./api";
import { Role } from "./role.service";

export interface User {
  id: number;
  email: string;
  fullName: string;
  role: Role | string;
  status: string;
  permissions?: string[];
  employee?: {
    id: number;
    fullName: string;
    employeeCode: string;
  } | null;
  avatar?: string | null;
  updatedAt?: string;
  updater?: {
    fullName: string;
  };
}

export interface CreateUserDto {
  email: string;
  fullName: string;
  password?: string;
  roleId: number;
}

export interface UpdateUserDto {
  email?: string;
  fullName?: string;
  password?: string;
  roleId?: number;
  status?: string;
}

export const userService = {
  getAll: async () => {
    const response = await api.get<{ data: User[] }>("/user");
    return response.data.data;
  },

  getOne: async (id: number) => {
    const response = await api.get<{ data: User }>(`/user/${id}`);
    return response.data.data;
  },

  create: async (data: CreateUserDto) => {
    const response = await api.post<{ data: User }>("/user", data);
    return response.data.data;
  },

  update: async (id: number, data: UpdateUserDto) => {
    const response = await api.patch<{ data: User }>(`/user/${id}`, data);
    return response.data.data;
  },

  remove: async (id: number) => {
    const response = await api.delete(`/user/${id}`);
    return response.data;
  },

  uploadAvatar: async (id: number, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post<{ data: User }>(
      `/user/${id}/avatar`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
    return response.data.data;
  },
};
