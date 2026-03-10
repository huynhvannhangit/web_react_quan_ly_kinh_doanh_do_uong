import api from "./api";

export interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationResponse {
  items: Notification[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const notificationService = {
  findAll: async (page = 1, limit = 20): Promise<NotificationResponse> => {
    const response = await api.get<NotificationResponse>("/notifications", {
      params: { page, limit },
    });
    return response.data;
  },

  findOne: async (id: number): Promise<Notification> => {
    const response = await api.get<Notification>(`/notifications/${id}`);
    return response.data;
  },

  markAsRead: async (id: number): Promise<void> => {
    await api.patch(`/notifications/${id}/read`);
  },

  markAllAsRead: async (): Promise<void> => {
    await api.patch("/notifications/read-all");
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/notifications/${id}`);
  },
};
