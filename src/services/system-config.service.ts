import api from "./api";

export interface SystemConfig {
  id: string;
  systemName: string;
  logoUrl: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  footerText: string | null;
}

export interface UpdateSystemConfigDto {
  systemName?: string;
  logoUrl?: string;
  email?: string;
  phone?: string;
  address?: string;
  footerText?: string;
}

export const systemConfigService = {
  get: async (): Promise<SystemConfig> => {
    const response = await api.get("/system-config");
    return response.data.data;
  },

  update: async (data: UpdateSystemConfigDto): Promise<SystemConfig> => {
    const response = await api.patch("/system-config", data);
    return response.data.data;
  },

  uploadLogo: async (file: File): Promise<SystemConfig> => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post("/system-config/logo", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data.data;
  },
};
