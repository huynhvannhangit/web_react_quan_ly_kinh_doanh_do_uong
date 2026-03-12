// cspell:disable
"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  loggingService,
  UserLog,
  LogQueryParams,
} from "@/services/logging.service";
import { Permission } from "@/types";
import { PermissionGuard } from "@/components/shared/PermissionGuard";
import { Pagination } from "@/components/shared/Pagination";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, RotateCcw, Eye } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

const MODULE_LABELS: Record<string, string> = {
  LOGGING: "Nhật ký",
  PRODUCT: "Sản phẩm",
  CATEGORY: "Danh mục",
  ORDER: "Đơn hàng",
  INVOICE: "Hoá đơn",
  TABLE: "Bàn",
  AREA: "Khu vực",
  EMPLOYEE: "Nhân viên",
  APPROVAL: "Phê duyệt",
  USER: "Tài khoản",
  ROLE: "Vai trò",
  SYSTEM: "Hệ thống",
  STATISTICS: "Thống kê",
  AI_ASSISTANT: "Trợ lý AI",
};

const ACTION_LABELS: Record<string, string> = {
  VIEW_LOGS: "Xem nhật ký",
  CREATE: "Tạo mới",
  UPDATE: "Cập nhật",
  DELETE: "Xóa",
  VIEW_LIST: "Xem danh sách",
  VIEW_DETAIL: "Xem chi tiết",
  APPROVE: "Phê duyệt",
  REJECT: "Từ chối",
  PAY: "Thanh toán",
  CANCEL: "Huỷ",
  LOGIN: "Đăng nhập",
  LOGOUT: "Đăng xuất",
  // Product
  CREATE_PRODUCT: "Tạo sản phẩm",
  UPDATE_PRODUCT: "Cập nhật sản phẩm",
  DELETE_PRODUCT: "Xóa sản phẩm",
  UPLOAD_IMAGE: "Tải ảnh lên",
  // Category
  CREATE_CATEGORY: "Tạo danh mục",
  UPDATE_CATEGORY: "Cập nhật danh mục",
  DELETE_CATEGORY: "Xóa danh mục",
  // Area
  CREATE_AREA: "Tạo khu vực",
  UPDATE_AREA: "Cập nhật khu vực",
  DELETE_AREA: "Xóa khu vực",
  // Table
  CREATE_TABLE: "Tạo bàn",
  UPDATE_TABLE: "Cập nhật bàn",
  DELETE_TABLE: "Xóa bàn",
  // Employee
  CREATE_EMPLOYEE: "Tạo nhân viên",
  UPDATE_EMPLOYEE: "Cập nhật nhân viên",
  DELETE_EMPLOYEE: "Xóa nhân viên",
  // Order
  CREATE_ORDER: "Tạo đơn hàng",
  UPDATE_ORDER: "Cập nhật đơn hàng",
  CANCEL_ORDER: "Huỷ đơn hàng",
  // Invoice
  PAY_INVOICE: "Thanh toán hoá đơn",
  CANCEL_INVOICE: "Huỷ hoá đơn",
  VIEW_INVOICE: "Xem hoá đơn",
  // Approval
  APPROVE_REQUEST: "Phê duyệt yêu cầu",
  REJECT_REQUEST: "Từ chối yêu cầu",
};

const ACTION_COLORS: Record<string, string> = {
  DELETE: "bg-red-100 text-red-700 border-red-200",
  DELETE_PRODUCT: "bg-red-100 text-red-700 border-red-200",
  DELETE_CATEGORY: "bg-red-100 text-red-700 border-red-200",
  DELETE_AREA: "bg-red-100 text-red-700 border-red-200",
  DELETE_TABLE: "bg-red-100 text-red-700 border-red-200",
  DELETE_EMPLOYEE: "bg-red-100 text-red-700 border-red-200",
  CANCEL: "bg-red-100 text-red-700 border-red-200",
  CANCEL_ORDER: "bg-red-100 text-red-700 border-red-200",
  CANCEL_INVOICE: "bg-red-100 text-red-700 border-red-200",
  REJECT: "bg-red-100 text-red-700 border-red-200",
  REJECT_REQUEST: "bg-red-100 text-red-700 border-red-200",
  CREATE: "bg-emerald-100 text-emerald-700 border-emerald-200",
  CREATE_PRODUCT: "bg-emerald-100 text-emerald-700 border-emerald-200",
  CREATE_CATEGORY: "bg-emerald-100 text-emerald-700 border-emerald-200",
  CREATE_AREA: "bg-emerald-100 text-emerald-700 border-emerald-200",
  CREATE_TABLE: "bg-emerald-100 text-emerald-700 border-emerald-200",
  CREATE_EMPLOYEE: "bg-emerald-100 text-emerald-700 border-emerald-200",
  CREATE_ORDER: "bg-emerald-100 text-emerald-700 border-emerald-200",
  APPROVE: "bg-emerald-100 text-emerald-700 border-emerald-200",
  APPROVE_REQUEST: "bg-emerald-100 text-emerald-700 border-emerald-200",
  PAY: "bg-emerald-100 text-emerald-700 border-emerald-200",
  PAY_INVOICE: "bg-emerald-100 text-emerald-700 border-emerald-200",
  UPDATE: "bg-amber-100 text-amber-700 border-amber-200",
  UPDATE_PRODUCT: "bg-amber-100 text-amber-700 border-amber-200",
  UPDATE_CATEGORY: "bg-amber-100 text-amber-700 border-amber-200",
  UPDATE_AREA: "bg-amber-100 text-amber-700 border-amber-200",
  UPDATE_TABLE: "bg-amber-100 text-amber-700 border-amber-200",
  UPDATE_EMPLOYEE: "bg-amber-100 text-amber-700 border-amber-200",
  UPDATE_ORDER: "bg-amber-100 text-amber-700 border-amber-200",
  UPLOAD_IMAGE: "bg-amber-100 text-amber-700 border-amber-200",
  VIEW_LIST: "bg-blue-100 text-blue-700 border-blue-200",
  VIEW_DETAIL: "bg-blue-100 text-blue-700 border-blue-200",
  VIEW_LOGS: "bg-blue-100 text-blue-700 border-blue-200",
  VIEW_INVOICE: "bg-blue-100 text-blue-700 border-blue-200",
  LOGIN: "bg-purple-100 text-purple-700 border-purple-200",
  LOGOUT: "bg-slate-100 text-slate-700 border-slate-200",
};

function formatIp(ip: string | null): string {
  if (!ip) return "—";
  // Convert IPv6 loopback to readable IPv4 format
  if (ip === "::1" || ip === "::ffff:127.0.0.1") return "127.0.0.1";
  // Strip IPv6-mapped IPv4: ::ffff:192.168.x.x
  if (ip.startsWith("::ffff:")) return ip.replace("::ffff:", "");
  return ip;
}

const ALL_MODULES = Object.keys(MODULE_LABELS);

export default function SystemLogPage() {
  const [logs, setLogs] = useState<UserLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const [searchModule, setSearchModule] = useState("");
  const [searchAction, setSearchAction] = useState("");

  const [selectedLog, setSelectedLog] = useState<UserLog | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const loadLogs = useCallback(
    async (overrideParams?: Partial<LogQueryParams>) => {
      setIsLoading(true);
      try {
        const params: LogQueryParams = {
          page: overrideParams?.page ?? currentPage,
          limit: pageSize,
          module: overrideParams?.module ?? (searchModule || undefined),
          action: overrideParams?.action ?? (searchAction || undefined),
        };
        const res = await loggingService.findAll(params);
        setLogs(Array.isArray(res.data) ? res.data : []);
        setTotal(res.total ?? 0);
      } catch (error) {
        console.error("Failed to load logs:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [currentPage, searchModule, searchAction],
  );

  useEffect(() => {
    void loadLogs();
  }, [loadLogs]);

  const handleSearch = () => {
    setCurrentPage(1);
    void loadLogs({ page: 1 });
  };

  const handleReset = () => {
    setSearchModule("");
    setSearchAction("");
    setCurrentPage(1);
    void loadLogs({ page: 1, module: undefined, action: undefined });
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    void loadLogs({ page });
  };

  const openDetail = (log: UserLog) => {
    setSelectedLog(log);
    setIsDetailOpen(true);
  };

  const globalOffset = (currentPage - 1) * pageSize;

  return (
    <PermissionGuard
      permissions={[Permission.LOGGING_VIEW_ALL]}
      redirect="/dashboard"
    >
      <Card>
        <CardContent className="p-8 space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold tracking-wide text-[#00509E] dark:text-blue-400 uppercase">
              Nhật ký hệ thống
            </h1>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-end justify-between mt-6 w-full gap-4">
            <div className="flex flex-wrap items-end gap-3 flex-1">
              {/* Module filter */}
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground">Module</label>
                <Select
                  value={searchModule || "all"}
                  onValueChange={(val) =>
                    setSearchModule(val === "all" ? "" : val)
                  }
                >
                  <SelectTrigger className="w-44 h-10">
                    <SelectValue placeholder="Tất cả module" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả module</SelectItem>
                    {ALL_MODULES.map((m) => (
                      <SelectItem key={m} value={m}>
                        {MODULE_LABELS[m] ?? m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Action filter */}
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground">
                  Hành động
                </label>
                <Select
                  value={searchAction || "all"}
                  onValueChange={(val) =>
                    setSearchAction(val === "all" ? "" : val)
                  }
                >
                  <SelectTrigger className="w-52 h-10">
                    <SelectValue placeholder="Tất cả hành động" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả hành động</SelectItem>
                    <SelectItem value="VIEW_LOGS">Xem nhật ký</SelectItem>
                    <SelectItem value="CREATE_PRODUCT">Tạo sản phẩm</SelectItem>
                    <SelectItem value="UPDATE_PRODUCT">
                      Cập nhật sản phẩm
                    </SelectItem>
                    <SelectItem value="DELETE_PRODUCT">Xóa sản phẩm</SelectItem>
                    <SelectItem value="UPLOAD_IMAGE">Tải ảnh lên</SelectItem>
                    <SelectItem value="CREATE_CATEGORY">
                      Tạo danh mục
                    </SelectItem>
                    <SelectItem value="UPDATE_CATEGORY">
                      Cập nhật danh mục
                    </SelectItem>
                    <SelectItem value="DELETE_CATEGORY">
                      Xóa danh mục
                    </SelectItem>
                    <SelectItem value="CREATE_AREA">Tạo khu vực</SelectItem>
                    <SelectItem value="UPDATE_AREA">
                      Cập nhật khu vực
                    </SelectItem>
                    <SelectItem value="DELETE_AREA">Xóa khu vực</SelectItem>
                    <SelectItem value="CREATE_TABLE">Tạo bàn</SelectItem>
                    <SelectItem value="UPDATE_TABLE">Cập nhật bàn</SelectItem>
                    <SelectItem value="DELETE_TABLE">Xóa bàn</SelectItem>
                    <SelectItem value="CREATE_EMPLOYEE">
                      Tạo nhân viên
                    </SelectItem>
                    <SelectItem value="UPDATE_EMPLOYEE">
                      Cập nhật nhân viên
                    </SelectItem>
                    <SelectItem value="DELETE_EMPLOYEE">
                      Xóa nhân viên
                    </SelectItem>
                    <SelectItem value="CREATE_ORDER">Tạo đơn hàng</SelectItem>
                    <SelectItem value="UPDATE_ORDER">
                      Cập nhật đơn hàng
                    </SelectItem>
                    <SelectItem value="CANCEL_ORDER">Huỷ đơn hàng</SelectItem>
                    <SelectItem value="PAY_INVOICE">
                      Thanh toán hoá đơn
                    </SelectItem>
                    <SelectItem value="CANCEL_INVOICE">Huỷ hoá đơn</SelectItem>
                    <SelectItem value="APPROVE_REQUEST">
                      Phê duyệt yêu cầu
                    </SelectItem>
                    <SelectItem value="REJECT_REQUEST">
                      Từ chối yêu cầu
                    </SelectItem>
                    <SelectItem value="LOGIN">Đăng nhập</SelectItem>
                    <SelectItem value="LOGOUT">Đăng xuất</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-end gap-2 mb-0.5">
              <Button
                onClick={handleSearch}
                className="gap-2 bg-[#00509E] hover:bg-[#00509E]/90 text-white rounded-lg h-10"
              >
                <Search className="h-4 w-4" />
                Tìm kiếm
              </Button>
              <Button
                variant="outline"
                onClick={handleReset}
                className="gap-2 rounded-lg h-10"
              >
                <RotateCcw className="h-4 w-4" />
                Làm mới
              </Button>
            </div>
          </div>

          {/* Table */}
          <Card className="border-none shadow-none">
            <CardHeader className="flex flex-row items-center justify-between pb-4 px-0">
              <div className="flex items-center gap-4">
                <CardTitle className="text-lg font-semibold text-foreground">
                  Danh sách nhật ký ({total} bản ghi)
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="px-0">
              <div className="overflow-x-auto [&_th]:bg-muted [&_th]:text-muted-foreground [&_th]:font-semibold [&_td]:py-4">
                <Table className="min-w-325 font-sans">
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-border">
                      <TableHead className="w-16 text-center whitespace-nowrap">
                        STT
                      </TableHead>
                      <TableHead className="whitespace-nowrap">
                        Người dùng
                      </TableHead>
                      <TableHead className="whitespace-nowrap">
                        Module
                      </TableHead>
                      <TableHead className="whitespace-nowrap">
                        Hành động
                      </TableHead>
                      <TableHead className="whitespace-nowrap">Mô tả</TableHead>
                      <TableHead className="whitespace-nowrap">
                        Địa chỉ IP
                      </TableHead>
                      <TableHead className="whitespace-nowrap">
                        Thời gian
                      </TableHead>
                      <TableHead className="text-right whitespace-nowrap">
                        Chi tiết
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-12">
                          <div className="flex flex-col items-center gap-2 text-muted-foreground">
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                            Đang tải dữ liệu...
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : logs.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={8}
                          className="text-center py-12 text-muted-foreground"
                        >
                          Không có nhật ký nào
                        </TableCell>
                      </TableRow>
                    ) : (
                      logs.map((log, index) => (
                        <TableRow
                          key={log.id}
                          className="hover:bg-muted/50 transition-colors border-border"
                        >
                          <TableCell className="text-center font-medium text-muted-foreground">
                            {globalOffset + index + 1}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium text-foreground">
                                {log.user?.fullName ||
                                  log.user?.username ||
                                  "Hệ thống"}
                              </span>
                              {log.userId && (
                                <span className="text-xs text-muted-foreground">
                                  ID: {log.userId}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className="bg-slate-50 text-slate-700 border-slate-200 whitespace-nowrap"
                            >
                              {MODULE_LABELS[log.module ?? ""] ??
                                log.module ??
                                "—"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                ACTION_COLORS[log.action] ??
                                "bg-slate-100 text-slate-700 border-slate-200"
                              }
                            >
                              {ACTION_LABELS[log.action] ?? log.action}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm max-w-60 truncate">
                            {log.description || "—"}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm font-mono whitespace-nowrap">
                            {formatIp(log.ipAddress)}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                            {format(
                              new Date(log.createdAt),
                              "dd/MM/yyyy HH:mm:ss",
                              { locale: vi },
                            )}
                          </TableCell>
                          <TableCell className="text-right whitespace-nowrap">
                            <button
                              className="p-2 hover:text-[#00509E] hover:bg-[#00509E]/10 rounded-lg transition-all text-slate-500"
                              onClick={() => openDetail(log)}
                              title="Xem chi tiết"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={total}
                onPageChange={handlePageChange}
              />
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chi tiết nhật ký {selectedLog?.id}</DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="grid gap-4 py-2">
              <div className="grid grid-cols-2 gap-4 border-b pb-4">
                <div>
                  <p className="text-xs text-muted-foreground">Người dùng</p>
                  <p className="font-medium mt-1">
                    {selectedLog.user?.fullName ||
                      selectedLog.user?.username ||
                      "Hệ thống"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Thời gian</p>
                  <p className="font-medium mt-1">
                    {format(
                      new Date(selectedLog.createdAt),
                      "dd/MM/yyyy HH:mm:ss",
                      { locale: vi },
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Module</p>
                  <p className="font-medium mt-1">
                    {MODULE_LABELS[selectedLog.module ?? ""] ??
                      selectedLog.module ??
                      "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Hành động</p>
                  <p className="font-medium mt-1">
                    {ACTION_LABELS[selectedLog.action] ?? selectedLog.action}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Địa chỉ IP</p>
                  <p className="font-mono text-sm mt-1">
                    {formatIp(selectedLog.ipAddress)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">User Agent</p>
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    {selectedLog.userAgent || "—"}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Mô tả</p>
                <p className="text-sm italic text-muted-foreground bg-muted rounded-md px-3 py-2">
                  {selectedLog.description || "Không có mô tả"}
                </p>
              </div>
              {selectedLog.metadata && (
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-foreground/70 uppercase tracking-wider">
                    Dữ liệu chi tiết (Metadata)
                  </p>
                  <div className="bg-muted/30 rounded-lg p-4 border border-border/50">
                    <MetadataViewer metadata={selectedLog.metadata} />
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </PermissionGuard>
  );
}

function MetadataViewer({ metadata }: { metadata: Record<string, unknown> }) {
  const translateKey = (key: string): string => {
    const keys: Record<string, string> = {
      method: "Phương thức",
      url: "Đường dẫn",
      body: "Dữ liệu gửi lên (Body)",
      params: "Tham số đường dẫn (Params)",
      query: "Tham số truy vấn (Query)",
      id: "Mã định danh (ID)",
      status: "Trạng thái",
      message: "Thông điệp",
      error: "Lỗi",
      data: "Dữ liệu",
      before: "Trước khi thay đổi",
      after: "Sau khi thay đổi",
    };
    return keys[key] || key;
  };

  const renderValue = (value: unknown, isNested = false): React.ReactNode => {
    if (value === null || value === undefined) return <span className="text-muted-foreground italic">Trống</span>;
    if (typeof value === "object") {
      const obj = value as Record<string, unknown>;
      if (Object.keys(obj).length === 0) return <span className="text-muted-foreground">—</span>;
      return (
        <div className={`mt-1.5 space-y-2 ${isNested ? "ml-3 py-1 border-l border-border/60 pl-3" : ""}`}>
          {Object.entries(obj).map(([k, v]) => (
            <div key={k} className="flex flex-col">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">
                {translateKey(k)}
              </span>
              <div className="text-sm">{renderValue(v, true)}</div>
            </div>
          ))}
        </div>
      );
    }
    if (typeof value === "boolean") {
      return (
        <Badge variant="outline" className={`h-5 text-[10px] px-1.5 ${value ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-red-50 text-red-600 border-red-100"}`}>
          {value ? "CÓ" : "KHÔNG"}
        </Badge>
      );
    }
    return <span className="text-foreground/90 font-medium break-all">{String(value)}</span>;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
      {Object.entries(metadata).map(([key, value]) => {
        const isLongContent = key === "url" || (typeof value === "string" && value.length > 50) || (typeof value === "object" && value !== null && Object.keys(value).length > 3);
        return (
          <div key={key} className={`flex flex-col ${isLongContent ? "md:col-span-2" : ""}`}>
            <span className="text-[11px] font-semibold text-[#00509E]/80 dark:text-blue-400 uppercase tracking-widest mb-1.5">
              {translateKey(key)}
            </span>
            <div className="min-h-6">
              {renderValue(value)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
