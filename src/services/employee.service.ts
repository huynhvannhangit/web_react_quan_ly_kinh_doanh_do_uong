import api from "./api";

export interface Employee {
  id: number;
  employeeCode: string;
  fullName: string;
  phone?: string;
  address?: string;
  birthDate?: string;
  position?: string;
  salary: number;
  userId?: number;
  createdAt: string;
  updatedAt: string;
}

export const employeeService = {
  getAll: async () => {
    const response = await api.get<{ data: Employee[] }>("/employee");
    return response.data.data;
  },

  getById: async (id: number) => {
    const response = await api.get<{ data: Employee }>(`/employee/${id}`);
    return response.data.data;
  },

  create: async (data: Omit<Employee, "id" | "createdAt" | "updatedAt">) => {
    const response = await api.post<{ data: Employee }>("/employee", data);
    return response.data.data;
  },

  update: async (id: number, data: Partial<Employee>) => {
    const response = await api.patch<{ data: Employee }>(
      `/employee/${id}`,
      data,
    );
    return response.data.data;
  },

  delete: async (id: number) => {
    await api.delete(`/employee/${id}`);
  },
};
