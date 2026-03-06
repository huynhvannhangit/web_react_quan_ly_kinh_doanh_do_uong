"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
import { Download, TrendingUp, BarChart3, Loader2, Filter } from "lucide-react";
import dayjs from "dayjs";
import { DatePicker } from "@/components/shared/DatePicker";

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
    <div className="space-y-6">
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
          >
            {exporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Xuất Excel
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Filter className="h-4 w-4" /> Bộ lọc thời gian
          </CardTitle>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardDescription className="text-primary/70">
              Tổng doanh thu
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-primary">
              {new Intl.NumberFormat("vi-VN").format(totalRevenue)}đ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-xs text-primary/60">
              <TrendingUp className="h-3 w-3 mr-1" /> Toàn bộ thời gian đã chọn
            </div>
          </CardContent>
        </Card>

        <Card className="bg-emerald-500/10 border-emerald-500/20">
          <CardHeader className="pb-2">
            <CardDescription className="text-emerald-600/70 dark:text-emerald-400/70">
              Tổng đơn hàng
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {totalOrders} đơn
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-xs text-emerald-600/60 dark:text-emerald-400/60">
              <BarChart3 className="h-3 w-3 mr-1" /> Trung bình{" "}
              {data.length > 0 ? (totalOrders / data.length).toFixed(1) : 0}{" "}
              đơn/mốc
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" /> Biểu đồ doanh thu
          </CardTitle>
          <CardDescription>
            Trực quan hoá doanh thu theo{" "}
            {query.groupBy === "day"
              ? "ngày"
              : query.groupBy === "week"
                ? "tuần"
                : "tháng"}
          </CardDescription>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>

      {!isLoading && data.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Chi tiết doanh số</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-4 font-semibold">Thời gian</th>
                    <th className="text-right p-4 font-semibold">
                      Số đơn hàng
                    </th>
                    <th className="text-right p-4 font-semibold">Doanh thu</th>
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
          </CardContent>
        </Card>
      )}
    </div>
  );
}
