import api from "./api";

export interface RevenueData {
  date: string;
  revenue: number;
  count: number;
}

export interface TopProduct {
  name: string;
  quantity: number;
  revenue: number;
}

export interface StatisticsOverview {
  totalRevenue: number;
  totalOrders: number;
  paidOrders: number;
  completionRate: number;
  pendingApprovals: number;
}

export interface StatisticsQuery {
  startDate?: string;
  endDate?: string;
  groupBy?: "day" | "week" | "month";
}

// Aliases for Dashboard compatibility
export type OverviewStats = StatisticsOverview;
export type RevenueStats = RevenueData;
export type TopProductStats = TopProduct;

export const statisticsService = {
  getOverview: async (): Promise<StatisticsOverview> => {
    const response = await api.get<{ data: StatisticsOverview }>(
      "/statistics/overview",
    );
    return response.data.data;
  },

  getRevenue: async (query: StatisticsQuery = {}): Promise<RevenueData[]> => {
    const response = await api.get<{ data: RevenueData[] }>(
      "/statistics/revenue",
      { params: query },
    );
    return response.data.data;
  },

  getTopProducts: async (): Promise<TopProduct[]> => {
    const response = await api.get<{ data: TopProduct[] }>(
      "/statistics/top-products",
    );
    return response.data.data;
  },

  exportExcel: async (query: StatisticsQuery): Promise<void> => {
    const response = await api.get("/statistics/export", {
      params: query,
      responseType: "blob",
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `bao-cao-doanh-thu.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },
};
