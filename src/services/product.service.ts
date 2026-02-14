import api from "./api";

export interface Category {
  id: number;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  isAvailable: boolean;
  categoryId: number;
  category?: Category;
  createdAt: string;
  updatedAt: string;
}

export const categoryService = {
  getAll: async () => {
    const response = await api.get<{ data: Category[] }>("/category");
    return response.data.data;
  },
  create: async (data: { name: string; description?: string }) => {
    const response = await api.post<{ data: Category }>("/category", data);
    return response.data.data;
  },
};

export const productService = {
  getAll: async () => {
    const response = await api.get<{ data: Product[] }>("/product");
    return response.data.data;
  },
  create: async (
    data: Omit<Product, "id" | "createdAt" | "updatedAt" | "category">,
  ) => {
    const response = await api.post<{ data: Product }>("/product", data);
    return response.data.data;
  },
};
