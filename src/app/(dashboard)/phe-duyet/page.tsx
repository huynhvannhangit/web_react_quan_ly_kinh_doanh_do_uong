// cspell:disable
"use client";

import React, { useEffect, useState } from "react";
import { approvalService } from "@/services/approval.service";
import {
  ApprovalRequest,
  ApprovalStatus,
  ApprovalType,
} from "@/types/approval";
import { Permission } from "@/types";
import { PermissionGuard } from "@/components/shared/PermissionGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle, Clock, Eye } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

// Helper for type translation
const typeLabels: Record<string, string> = {
  [ApprovalType.INVOICE_CANCEL]: "Huỷ hoá đơn",
  [ApprovalType.INVOICE_MERGE]: "Gộp hoá đơn",
  [ApprovalType.PRODUCT_DELETE]: "Xoá sản phẩm",
  [ApprovalType.EMPLOYEE_DELETE]: "Xoá nhân viên",
  [ApprovalType.UPDATE]: "Cập nhật",
  [ApprovalType.DELETE]: "Xoá",
};

// Helper for status styling
const statusConfig: Record<
  ApprovalStatus,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
    icon: React.ElementType;
  }
> = {
  [ApprovalStatus.PENDING]: {
    label: "Chờ duyệt",
    variant: "outline",
    icon: Clock,
  },
  [ApprovalStatus.APPROVED]: {
    label: "Đã duyệt",
    variant: "default",
    icon: CheckCircle,
  },
  [ApprovalStatus.REJECTED]: {
    label: "Từ chối",
    variant: "destructive",
    icon: XCircle,
  },
};

/** Map field names to Vietnamese labels */
const fieldLabels: Record<string, string> = {
  // Product
  name: "Tên",
  price: "Giá bán (VNĐ)",
  description: "Mô tả",
  isAvailable: "Trạng thái kinh doanh",
  imageUrl: "Hình ảnh",
  categoryId: "Danh mục (ID)",
  // Employee
  fullName: "Họ và tên",
  phone: "Số điện thoại",
  address: "Địa chỉ",
  baseSalary: "Lương cơ bản",
  position: "Chức vụ",
  startDate: "Ngày bắt đầu",
  email: "Email",
  // Area / Table
  capacity: "Sức chứa",
  status: "Trạng thái",
  areaId: "Khu vực (ID)",
  tableNumber: "Số bàn",
  floor: "Tầng",
  // Invoice
  totalAmount: "Tổng tiền",
  note: "Ghi chú",
  paymentMethod: "Phương thức thanh toán",
};

/** Render a table comparing old vs new data from metadata */
function DataComparisonTable({
  metadata,
}: {
  metadata: Record<string, unknown> | undefined;
}) {
  if (!metadata) return null;
  const oldData = metadata.oldData as Record<string, unknown> | undefined;
  const newData = metadata.newData as Record<string, unknown> | undefined;

  if (!oldData && !newData) return null;

  // Skip internal/relation fields
  const skipKeys = new Set([
    "id",
    "createdAt",
    "updatedAt",
    "deletedAt",
    "createdBy",
    "updatedBy",
    "deletedBy",
    "creator",
    "updater",
    "tables",
    "area",
    "items",
    "category",
    "requestedBy",
    "reviewedBy",
    "role",
    "permissions",
    "user",
    "employee",
  ]);

  const allKeys = Array.from(
    new Set([...Object.keys(oldData ?? {}), ...Object.keys(newData ?? {})]),
  ).filter((k) => !skipKeys.has(k));

  if (allKeys.length === 0) return null;

  const formatValue = (v: unknown): string => {
    if (v === null || v === undefined) return "—";
    if (typeof v === "boolean") return v ? "Có" : "Không";
    if (typeof v === "object") return JSON.stringify(v);
    if (typeof v === "number" && String(v).length > 4) {
      return new Intl.NumberFormat("vi-VN").format(v);
    }
    return String(v);
  };

  return (
    <div className="rounded-md border overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-muted">
          <tr>
            <th className="text-left px-3 py-2 font-medium w-1/3">Trường</th>
            <th className="text-left px-3 py-2 font-medium w-1/3 text-muted-foreground">
              Giá trị cũ
            </th>
            <th className="text-left px-3 py-2 font-medium w-1/3 text-primary">
              Giá trị mới
            </th>
          </tr>
        </thead>
        <tbody>
          {allKeys.map((key) => {
            const oldVal = formatValue(oldData?.[key]);
            const newVal = formatValue(newData?.[key]);
            const changed = oldVal !== newVal;
            return (
              <tr
                key={String(key)}
                className={changed ? "bg-amber-50 dark:bg-amber-950/20" : ""}
              >
                <td className="px-3 py-1.5 text-sm font-medium border-t">
                  {fieldLabels[key] ?? key}
                </td>
                <td className="px-3 py-1.5 border-t line-through text-muted-foreground">
                  {oldVal}
                </td>
                <td
                  className={`px-3 py-1.5 border-t font-medium ${changed ? "text-primary" : ""}`}
                >
                  {newVal}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function ApprovalPage() {
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] =
    useState<ApprovalRequest | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    setIsLoading(true);
    try {
      const data = await approvalService.findAll();
      setRequests(data);
    } catch (error) {
      console.error("Failed to load approvals:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReview = async (status: ApprovalStatus) => {
    if (!selectedRequest) return;

    try {
      await approvalService.review(selectedRequest.id, {
        status,
        reviewNote,
      });
      setIsDetailOpen(false);
      loadRequests();
      setReviewNote("");
    } catch (error) {
      console.error("Failed to review request:", error);
      alert("Xử lý yêu cầu thất bại!");
    }
  };

  const openDetail = (request: ApprovalRequest) => {
    setSelectedRequest(request);
    setReviewNote(request.reviewNote || "");
    setIsDetailOpen(true);
  };

  const metadata = selectedRequest?.metadata as
    | Record<string, unknown>
    | undefined;

  return (
    <PermissionGuard
      permissions={[Permission.APPROVAL_VIEW]}
      redirect="/dashboard"
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">
            Phê duyệt yêu cầu
          </h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Danh sách yêu cầu phê duyệt</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã yêu cầu</TableHead>
                  <TableHead>Loại</TableHead>
                  <TableHead>Người yêu cầu</TableHead>
                  <TableHead>Thời gian</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      Đang tải...
                    </TableCell>
                  </TableRow>
                ) : requests.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-8 text-muted-foreground"
                    >
                      Chưa có yêu cầu nào
                    </TableCell>
                  </TableRow>
                ) : (
                  requests.map((req) => {
                    const config = statusConfig[req.status];
                    const StatusIcon = config.icon;
                    return (
                      <TableRow key={req.id}>
                        <TableCell className="font-medium font-mono text-xs">
                          {req.requestNumber}
                        </TableCell>
                        <TableCell>
                          {typeLabels[req.type] || req.type}
                        </TableCell>
                        <TableCell>
                          {req.requestedBy?.fullName || "—"}
                        </TableCell>
                        <TableCell>
                          {format(new Date(req.createdAt), "dd/MM/yyyy HH:mm", {
                            locale: vi,
                          })}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={config.variant}
                            className="flex w-fit items-center gap-1"
                          >
                            <StatusIcon className="h-3 w-3" />
                            {config.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDetail(req)}
                            className="flex items-center gap-1"
                          >
                            <Eye className="h-4 w-4" /> Chi tiết
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Chi tiết yêu cầu phê duyệt</DialogTitle>
            </DialogHeader>
            {selectedRequest && (
              <div className="grid gap-4 py-4">
                {/* Header info */}
                <div className="grid grid-cols-2 gap-4 border-b pb-4">
                  <div>
                    <Label className="text-muted-foreground">Mã yêu cầu</Label>
                    <div className="font-mono font-medium">
                      {selectedRequest.requestNumber}
                    </div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">
                      Loại yêu cầu
                    </Label>
                    <div>
                      {typeLabels[selectedRequest.type] || selectedRequest.type}
                    </div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">
                      Người yêu cầu
                    </Label>
                    <div>{selectedRequest.requestedBy?.fullName || "—"}</div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Thời gian</Label>
                    <div>
                      {format(
                        new Date(selectedRequest.createdAt),
                        "dd/MM/yyyy HH:mm",
                        { locale: vi },
                      )}
                    </div>
                  </div>
                </div>

                {/* Reason */}
                <div>
                  <Label className="text-muted-foreground">Lý do yêu cầu</Label>
                  <div className="mt-1 p-2 bg-muted rounded-md text-sm italic">
                    &quot;{selectedRequest.reason || "Không có lý do"}&quot;
                  </div>
                </div>

                {/* Data comparison */}
                {metadata &&
                  (Boolean(metadata.oldData) || Boolean(metadata.newData)) && (
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">
                        So sánh dữ liệu
                      </Label>
                      <DataComparisonTable metadata={metadata} />
                      {Boolean(metadata.newData) && (
                        <p className="text-xs text-muted-foreground">
                          * Các dòng nền vàng là trường có thay đổi
                        </p>
                      )}
                      {!metadata.newData && Boolean(metadata.oldData) && (
                        <p className="text-xs text-amber-600 font-medium">
                          ⚠ Yêu cầu xóa bản ghi này
                        </p>
                      )}
                    </div>
                  )}

                {/* Reviewer info (if already reviewed) */}
                {selectedRequest.status !== ApprovalStatus.PENDING && (
                  <div className="grid grid-cols-2 gap-4 border-t pt-4">
                    <div>
                      <Label className="text-muted-foreground">
                        Người duyệt
                      </Label>
                      <div>{selectedRequest.reviewedBy?.fullName || "—"}</div>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">
                        Thời gian duyệt
                      </Label>
                      <div>
                        {selectedRequest.reviewedAt
                          ? format(
                              new Date(selectedRequest.reviewedAt),
                              "dd/MM/yyyy HH:mm",
                              { locale: vi },
                            )
                          : "—"}
                      </div>
                    </div>
                  </div>
                )}

                {/* Review note */}
                <div className="grid gap-2">
                  <Label htmlFor="reviewNote">Ghi chú duyệt</Label>
                  <textarea
                    id="reviewNote"
                    className="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Nhập phản hồi hoặc lý do từ chối..."
                    value={reviewNote}
                    onChange={(e) => setReviewNote(e.target.value)}
                    readOnly={selectedRequest.status !== ApprovalStatus.PENDING}
                  />
                </div>
              </div>
            )}
            <DialogFooter className="gap-2 sm:gap-0">
              {selectedRequest?.status === ApprovalStatus.PENDING ? (
                <>
                  <Button
                    variant="destructive"
                    onClick={() => handleReview(ApprovalStatus.REJECTED)}
                    className="flex items-center gap-1"
                  >
                    <XCircle className="h-4 w-4" /> Từ chối
                  </Button>
                  <Button
                    variant="default"
                    onClick={() => handleReview(ApprovalStatus.APPROVED)}
                    className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-1"
                  >
                    <CheckCircle className="h-4 w-4" /> Phê duyệt
                  </Button>
                </>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => setIsDetailOpen(false)}
                >
                  Thoát
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PermissionGuard>
  );
}
