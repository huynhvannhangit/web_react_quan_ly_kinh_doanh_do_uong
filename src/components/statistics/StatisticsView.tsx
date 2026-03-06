/* cspell:disable */
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  statisticsService,
  RevenueData,
  StatisticsQuery,
} from "@/services/statistics.service";
import { TrendingUp, BarChart3, Loader2 } from "lucide-react";
import dayjs from "dayjs";
import { DatePicker } from "@/components/shared/DatePicker";

const ExcelIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    className={className}
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z"
      fill="#185C37"
    />
    <path d="M14 2V8H20" fill="#21A366" />
    <path
      d="M8.5 17L12.5 11M12.5 17L8.5 11"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <rect x="7" y="10" width="10" height="8" rx="1" fill="#185C37" />
    <path
      d="M9.5 16.5L14.5 11.5M14.5 16.5L9.5 11.5"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

interface StatisticsViewProps {
  defaultGroupBy: "day" | "week" | "month";
  title: string;
}

export function StatisticsView({ defaultGroupBy, title }: StatisticsViewProps) {
  const [data, setData] = useState<RevenueData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [query, setQuery] = useState<StatisticsQuery>({
    startDate: dayjs().subtract(1, "month").format("YYYY-MM-DD"),
    endDate: dayjs().format("YYYY-MM-DD"),
    groupBy: defaultGroupBy,
  });

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const result = await statisticsService.getRevenue(query);
        setData(result);
      } catch (error) {
        console.error("Failed to fetch statistics:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [query]);

  const handleExport = async () => {
    setExporting(true);
    try {
      await statisticsService.exportExcel(query);
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setExporting(false);
    }
  };

  const totalRevenue = useMemo(
    () =>
      Array.isArray(data)
        ? data.reduce((sum, item) => sum + item.revenue, 0)
        : 0,
    [data],
  );
  const totalOrders = useMemo(
    () =>
      Array.isArray(data) ? data.reduce((sum, item) => sum + item.count, 0) : 0,
    [data],
  );

  return (
    <Card>
      <CardContent className="p-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-wide text-[#00509E] dark:text-blue-400 uppercase">
              {title}
            </h1>
            <p className="text-muted-foreground">
              Theo dõi hiệu quả kinh doanh và doanh thu của bạn.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              onClick={handleExport}
              disabled={exporting || isLoading}
              className="h-10 px-4 text-[#008272] border-[#21a366] hover:bg-[#21a366]/10 hover:text-[#006655] dark:border-[#21a366] dark:hover:bg-[#21a366]/20 transition-all font-medium bg-white dark:bg-slate-900 shadow-sm rounded-md"
            >
              {exporting ? (
                <Loader2 className="mr-2 h-6 w-6 animate-spin" />
              ) : (
                <ExcelIcon className="mr-2 h-7 w-7" />
              )}
              Xuất Excel
            </Button>
          </div>
        </div>

        <div className="space-y-8">
          <div className="flex flex-wrap items-end gap-4">
            {query.groupBy === "month" ? (
              <>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase text-muted-foreground">
                    Từ ngày
                  </label>
                  <DatePicker
                    value={
                      query.startDate
                        ? dayjs(query.startDate).toDate()
                        : undefined
                    }
                    onChange={(date) =>
                      setQuery((prev) => ({
                        ...prev,
                        startDate: date ? dayjs(date).format("YYYY-MM-DD") : "",
                      }))
                    }
                    className="w-45 h-10"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase text-muted-foreground">
                    Đến ngày
                  </label>
                  <DatePicker
                    value={
                      query.endDate ? dayjs(query.endDate).toDate() : undefined
                    }
                    onChange={(date) =>
                      setQuery((prev) => ({
                        ...prev,
                        endDate: date ? dayjs(date).format("YYYY-MM-DD") : "",
                      }))
                    }
                    className="w-45 h-10"
                  />
                </div>
              </>
            ) : (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase text-muted-foreground">
                  {query.groupBy === "week" ? "Chọn tuần" : "Chọn ngày"}
                </label>
                <DatePicker
                  value={
                    query.startDate
                      ? dayjs(query.startDate).toDate()
                      : undefined
                  }
                  onChange={(date) => {
                    if (date) {
                      if (query.groupBy === "week") {
                        setQuery((prev) => ({
                          ...prev,
                          startDate: dayjs(date)
                            .startOf("week")
                            .format("YYYY-MM-DD"),
                          endDate: dayjs(date)
                            .endOf("week")
                            .format("YYYY-MM-DD"),
                        }));
                      } else {
                        setQuery((prev) => ({
                          ...prev,
                          startDate: dayjs(date).format("YYYY-MM-DD"),
                          endDate: dayjs(date).format("YYYY-MM-DD"),
                        }));
                      }
                    } else {
                      setQuery((prev) => ({
                        ...prev,
                        startDate: "",
                        endDate: "",
                      }));
                    }
                  }}
                  className="w-45 h-10"
                />
              </div>
            )}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase text-muted-foreground">
                Gộp theo
              </label>
              <Select
                value={query.groupBy}
                onValueChange={(val: "day" | "week" | "month") =>
                  setQuery((prev) => ({ ...prev, groupBy: val }))
                }
              >
                <SelectTrigger className="w-35 h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Theo ngày</SelectItem>
                  <SelectItem value="week">Theo tuần</SelectItem>
                  <SelectItem value="month">Theo tháng</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-6">
              <div className="text-sm font-medium text-primary/70 mb-1">
                Tổng doanh thu
              </div>
              <div className="text-2xl font-bold text-primary mb-2">
                {new Intl.NumberFormat("vi-VN").format(totalRevenue)}đ
              </div>
              <div className="flex items-center text-xs text-primary/60">
                <TrendingUp className="h-3 w-3 mr-1" /> Toàn bộ thời gian đã
                chọn
              </div>
            </div>

            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-6">
              <div className="text-sm font-medium text-emerald-600/70 dark:text-emerald-400/70 mb-1">
                Tổng đơn hàng
              </div>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mb-2">
                {totalOrders} đơn
              </div>
              <div className="flex items-center text-xs text-emerald-600/60 dark:text-emerald-400/60">
                <BarChart3 className="h-3 w-3 mr-1" /> Trung bình{" "}
                {data.length > 0 ? (totalOrders / data.length).toFixed(1) : 0}{" "}
                đơn/mốc
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <div className="text-lg font-semibold flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" /> Biểu đồ doanh thu
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Trực quan hoá doanh thu theo{" "}
                {query.groupBy === "day"
                  ? "ngày"
                  : query.groupBy === "week"
                    ? "tuần"
                    : "tháng"}
              </p>
            </div>
            {isLoading ? (
              <div className="h-87.5 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : data.length === 0 ? (
              <div className="h-87.5 flex items-center justify-center text-muted-foreground italic text-sm">
                Không có dữ liệu cho thời gian này
              </div>
            ) : (
              <div className="h-87.5 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[...data].reverse()}
                    margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="currentColor"
                      className="stroke-border"
                    />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                      dy={10}
                    />
                    <YAxis
                      tickFormatter={(val) => `${val / 1000}k`}
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                      dx={-10}
                    />
                    <Tooltip
                      formatter={(val: number | string | undefined) => [
                        val !== undefined
                          ? new Intl.NumberFormat("vi-VN").format(Number(val)) +
                            "đ"
                          : "0đ",
                        "Doanh thu",
                      ]}
                      contentStyle={{
                        borderRadius: "8px",
                        border: "1px solid hsl(var(--border))",
                        backgroundColor: "hsl(var(--background))",
                        color: "hsl(var(--foreground))",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                      }}
                      itemStyle={{ color: "hsl(var(--foreground))" }}
                      labelStyle={{ color: "hsl(var(--muted-foreground))" }}
                    />
                    <Legend />
                    <Bar
                      dataKey="revenue"
                      name="Doanh thu"
                      fill="#3b82f6"
                      radius={[4, 4, 0, 0]}
                      barSize={query.groupBy === "day" ? 20 : 40}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {!isLoading && data.length > 0 && (
            <div className="space-y-4">
              <div className="text-lg font-semibold">Chi tiết doanh số</div>
              <div className="overflow-x-auto border rounded-xl">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-4 font-semibold">Thời gian</th>
                      <th className="text-right p-4 font-semibold">
                        Số đơn hàng
                      </th>
                      <th className="text-right p-4 font-semibold">
                        Doanh thu
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((item, idx) => (
                      <tr
                        key={idx}
                        className="border-b hover:bg-muted/30 transition-colors"
                      >
                        <td className="p-4 font-medium">{item.date}</td>
                        <td className="p-4 text-right">{item.count} đơn</td>
                        <td className="p-4 text-right font-bold text-primary">
                          {new Intl.NumberFormat("vi-VN").format(item.revenue)}đ
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
