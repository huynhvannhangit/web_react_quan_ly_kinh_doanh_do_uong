import api from "./api";
import dayjs from "dayjs";

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

    const typeText =
      query.groupBy === "month"
        ? "tháng"
        : query.groupBy === "week"
          ? "tuần"
          : "ngày";

    let dateText = "";
    const start = query.startDate ? dayjs(query.startDate) : null;
    const end = query.endDate ? dayjs(query.endDate) : null;

    if (start && end) {
      if (start.isSame(end, "day")) {
        dateText = start.format("DD-MM-YYYY");
      } else {
        dateText = `${start.format("DD-MM-YYYY")} đến ${end.format("DD-MM-YYYY")}`;
      }
    } else if (start) {
      dateText = start.format("DD-MM-YYYY");
    } else {
      dateText = dayjs().format("DD-MM-YYYY");
    }

    const filename = `thống kê doanh thu ${typeText} ${dateText}.xlsx`;

    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  getDashboardData: async (): Promise<{
    overview: StatisticsOverview;
    revenue: RevenueData[];
    topProducts: TopProduct[];
  }> => {
    const response = await api.get<{
      data: {
        overview: StatisticsOverview;
        revenue: RevenueData[];
        topProducts: TopProduct[];
      };
    }>("/statistics/dashboard");
    return response.data.data;
  },
};
