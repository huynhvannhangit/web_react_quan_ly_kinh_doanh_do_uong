import api from "./api";

export interface OverviewStats {
  totalRevenue: number;
  totalOrders: number;
  paidOrders: number;
  completionRate: number;
}

export interface RevenueStats {
  date: string;
  revenue: number;
  count: number;
}

export interface TopProductStats {
  name: string;
  quantity: number;
  revenue: number;
}

export const statisticsService = {
  getOverview: async () => {
    const response = await api.get<{ data: OverviewStats }>(
      "/statistics/overview",
    );
    return response.data.data;
  },

  getRevenue: async (startDate?: string, endDate?: string) => {
    const response = await api.get<{ data: RevenueStats[] }>(
      "/statistics/revenue",
      {
        params: { startDate, endDate },
      },
    );
    return response.data.data;
  },

  getTopProducts: async () => {
    const response = await api.get<{ data: TopProductStats[] }>(
      "/statistics/top-products",
    );
    return response.data.data;
  },
};
