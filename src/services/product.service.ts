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
  getOne: async (id: number) => {
    const response = await api.get<{ data: Category }>(`/category/${id}`);
    return response.data.data;
  },
  create: async (data: { name: string; description?: string }) => {
    const response = await api.post<{ data: Category }>("/category", data);
    return response.data.data;
  },
  update: async (id: number, data: { name?: string; description?: string }) => {
    const response = await api.patch<{ data: Category }>(
      `/category/${id}`,
      data,
    );
    return response.data.data;
  },
  delete: async (id: number) => {
    const response = await api.delete<{ data: Category }>(`/category/${id}`);
    return response.data.data;
  },
};

export const productService = {
  getAll: async () => {
    const response = await api.get<{ data: Product[] }>("/product");
    return response.data.data;
  },
  getOne: async (id: number) => {
    const response = await api.get<{ data: Product }>(`/product/${id}`);
    return response.data.data;
  },
  create: async (
    data: Omit<Product, "id" | "createdAt" | "updatedAt" | "category">,
  ) => {
    const response = await api.post<{ data: Product }>("/product", data);
    return response.data.data;
  },
  update: async (
    id: number,
    data: Partial<Omit<Product, "id" | "createdAt" | "updatedAt" | "category">>,
  ) => {
    const response = await api.patch<{ data: Product }>(`/product/${id}`, data);
    return response.data.data;
  },
  delete: async (id: number) => {
    const response = await api.delete<{ data: Product }>(`/product/${id}`);
    return response.data.data;
  },
  uploadImage: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post<{ data: { url: string } }>(
      "/product/upload",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
    return response.data.data.url;
  },
};
