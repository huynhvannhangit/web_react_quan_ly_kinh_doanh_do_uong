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
// removed unused Checkbox and User import
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
import { Pagination } from "@/components/shared/Pagination";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input"; // Added Input import
import {
  Check,
  X,
  Eye,
  Search,
  RotateCcw,
  CheckCircle,
  XCircle,
} from "lucide-react"; // Updated Lucide imports (removed FileText, Clock)
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
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]); // Renamed requests to approvals
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  const filteredApprovals = approvals;
  const totalPages = Math.max(
    1,
    Math.ceil(filteredApprovals.length / pageSize),
  );
  const paginatedApprovals = filteredApprovals.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  const globalOffset = (currentPage - 1) * pageSize;
  const [selectedApproval, setSelectedApproval] =
    useState<ApprovalRequest | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  // Removed selectedIds and related states/functions as per instruction

  useEffect(() => {
    loadApprovals(); // Renamed loadRequests to loadApprovals
  }, []);

  const loadApprovals = async (keyword?: string) => {
    // Renamed loadRequests to loadApprovals
    setIsLoading(true);
    // setSelectedIds([]); // clear selection when loading new data - Removed
    try {
      const data = await approvalService.findAll(keyword);
      setApprovals(data); // Renamed setRequests to setApprovals
    } catch (error) {
      console.error("Failed to load approvals:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Removed handleSelectAll, handleSelectRow, handleBulkDelete as per instruction

  const handleStatusUpdate = async (id: number, status: ApprovalStatus) => {
    // New function for status update
    try {
      await approvalService.review(id, {
        status,
        reviewNote: "", // No review note for quick approve/reject from table
      });
      loadApprovals();
    } catch (error) {
      console.error("Failed to update approval status:", error);
      alert("Cập nhật trạng thái thất bại!");
    }
  };

  const handleReview = async (status: ApprovalStatus) => {
    if (!selectedApproval) return; // Changed selectedRequest to selectedApproval

    try {
      await approvalService.review(selectedApproval.id, {
        // Changed selectedRequest to selectedApproval
        status,
        reviewNote,
      });
      setIsDetailOpen(false);
      loadApprovals(); // Renamed loadRequests to loadApprovals
      setReviewNote("");
    } catch (error) {
      console.error("Failed to review request:", error);
      alert("Xử lý yêu cầu thất bại!");
    }
  };

  const openDetail = (request: ApprovalRequest) => {
    // Kept openDetail for dialog, but now uses setSelectedApproval
    setSelectedApproval(request);
    setReviewNote(request.reviewNote || "");
    setIsDetailOpen(true);
  };

  const metadata = selectedApproval?.metadata as  // Changed selectedRequest to selectedApproval
    | Record<string, unknown>
    | undefined;

  return (
    <PermissionGuard
      permissions={[Permission.APPROVAL_VIEW]}
      redirect="/dashboard"
    >
      <Card>
        <CardContent className="p-8 space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold tracking-wide text-[#00509E] dark:text-blue-400 uppercase">
              Quản lý Phê duyệt
            </h1>
          </div>

          <div className="flex flex-wrap items-end justify-between mt-6 w-full gap-4">
            <div className="flex flex-col gap-1 w-full max-w-150">
              <label className="text-xs text-muted-foreground text-left">
                Tìm kiếm sản phẩm, lý do hoặc người gửi
              </label>
              <Input
                placeholder="Tìm kiếm..."
                className="bg-background border-border rounded-lg h-10 w-full"
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setSearchTerm(e.target.value)
                }
                onKeyDown={(e) =>
                  e.key === "Enter" && void loadApprovals(searchTerm)
                }
              />
            </div>

            <div className="flex-1 flex justify-end items-end gap-2 mb-0.5 min-w-fit">
              <Button
                onClick={() => void loadApprovals(searchTerm)}
                className="gap-2 bg-[#00509E] hover:bg-[#00509E]/90 text-white rounded-lg"
              >
                <Search className="h-4 w-4" />
                Tìm kiếm
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  loadApprovals();
                }}
                className="gap-2 rounded-lg"
              >
                <RotateCcw className="h-4 w-4" />
                Làm mới
              </Button>
            </div>
          </div>

          <Card className="border-none shadow-none">
            <CardHeader className="flex flex-row items-center justify-between pb-4 px-0">
              <CardTitle className="text-lg font-semibold text-foreground">
                Danh sách yêu cầu phê duyệt
              </CardTitle>
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
                        Nội dung
                      </TableHead>
                      <TableHead className="whitespace-nowrap">
                        Loại yêu cầu
                      </TableHead>
                      <TableHead className="whitespace-nowrap">Lý do</TableHead>
                      <TableHead className="whitespace-nowrap">
                        Ngày cập nhật
                      </TableHead>
                      <TableHead className="whitespace-nowrap">
                        Người cập nhật
                      </TableHead>
                      <TableHead className="whitespace-nowrap">
                        Trạng thái
                      </TableHead>
                      <TableHead className="text-right whitespace-nowrap">
                        Thao tác
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
                    ) : filteredApprovals.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={8}
                          className="text-center py-12 text-muted-foreground"
                        >
                          {searchTerm
                            ? "Không tìm thấy yêu cầu phù hợp"
                            : "Chưa có yêu cầu phê duyệt nào"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedApprovals.map((approval, index) => (
                        <TableRow
                          key={approval.id}
                          className="hover:bg-muted/50 transition-colors border-border"
                        >
                          <TableCell className="text-center font-medium text-muted-foreground">
                            {globalOffset + index + 1}
                          </TableCell>
                          <TableCell className="font-semibold text-foreground">
                            {(
                              (approval.metadata || {}) as Record<
                                string,
                                unknown
                              >
                            ).name?.toString() || "K/X"}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <Badge
                              variant="outline"
                              className={
                                approval.type === ApprovalType.INVOICE_CANCEL ||
                                approval.type === ApprovalType.PRODUCT_DELETE ||
                                approval.type ===
                                  ApprovalType.EMPLOYEE_DELETE ||
                                approval.type === ApprovalType.DELETE
                                  ? "bg-red-50 text-red-700 border-red-200"
                                  : approval.type === ApprovalType.UPDATE
                                    ? "bg-amber-50 text-amber-700 border-amber-200"
                                    : "bg-blue-50 text-blue-700 border-blue-200"
                              }
                            >
                              {typeLabels[approval.type] || approval.type}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-xs truncate text-muted-foreground text-sm italic">
                            {approval.reason || "—"}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-[13px] whitespace-nowrap">
                            {new Date(approval.createdAt).toLocaleDateString(
                              "vi-VN",
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-[13px] whitespace-nowrap">
                            {approval.requestedBy?.fullName || "Hệ thống"}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <Badge
                              className={
                                approval.status === ApprovalStatus.PENDING
                                  ? "bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200"
                                  : approval.status === ApprovalStatus.APPROVED
                                    ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200"
                                    : "bg-red-100 text-red-700 hover:bg-red-100 border-red-200"
                              }
                            >
                              {approval.status === ApprovalStatus.PENDING
                                ? "Chờ duyệt"
                                : approval.status === ApprovalStatus.APPROVED
                                  ? "Đã duyệt"
                                  : "Từ chối"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-2 text-slate-500">
                              <button
                                className="p-2 hover:text-[#00509E] hover:bg-[#00509E]/10 rounded-lg transition-all"
                                onClick={() => void openDetail(approval)}
                                title="Xem chi tiết"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              {approval.status === ApprovalStatus.PENDING && (
                                <PermissionGuard
                                  permissions={[Permission.APPROVAL_MANAGE]}
                                >
                                  <button
                                    className="p-2 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                                    onClick={() =>
                                      void handleStatusUpdate(
                                        approval.id,
                                        ApprovalStatus.APPROVED,
                                      )
                                    }
                                    title="Phê duyệt"
                                  >
                                    <Check className="h-4 w-4" />
                                  </button>
                                  <button
                                    className="p-2 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                    onClick={() =>
                                      void handleStatusUpdate(
                                        approval.id,
                                        ApprovalStatus.REJECTED,
                                      )
                                    }
                                    title="Từ chối"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </PermissionGuard>
                              )}
                            </div>
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
                totalItems={approvals.length}
                onPageChange={setCurrentPage}
              />
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chi tiết yêu cầu phê duyệt</DialogTitle>
          </DialogHeader>
          {selectedApproval && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4 border-b pb-4">
                <div>
                  <Label className="text-muted-foreground">Mã yêu cầu</Label>
                  <div className="font-mono font-medium">
                    {selectedApproval.requestNumber}
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Loại yêu cầu</Label>
                  <div>
                    {typeLabels[selectedApproval.type] || selectedApproval.type}
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Người yêu cầu</Label>
                  <div>{selectedApproval.requestedBy?.fullName || "—"}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Thời gian</Label>
                  <div>
                    {format(
                      new Date(selectedApproval.createdAt),
                      "dd/MM/yyyy HH:mm",
                      { locale: vi },
                    )}
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground">Lý do yêu cầu</Label>
                <div className="mt-1 p-2 bg-muted rounded-md text-sm italic">
                  &quot;{selectedApproval.reason || "Không có lý do"}&quot;
                </div>
              </div>

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

              {selectedApproval.status !== ApprovalStatus.PENDING && (
                <div className="grid grid-cols-2 gap-4 border-t pt-4">
                  <div>
                    <Label className="text-muted-foreground">Người duyệt</Label>
                    <div>{selectedApproval.reviewedBy?.fullName || "—"}</div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">
                      Thời gian duyệt
                    </Label>
                    <div>
                      {selectedApproval.reviewedAt
                        ? format(
                            new Date(selectedApproval.reviewedAt),
                            "dd/MM/yyyy HH:mm",
                            { locale: vi },
                          )
                        : "—"}
                    </div>
                  </div>
                </div>
              )}

              <div className="grid gap-2">
                <Label htmlFor="reviewNote">Ghi chú duyệt</Label>
                <textarea
                  id="reviewNote"
                  className="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Nhập phản hồi hoặc lý do từ chối..."
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  readOnly={selectedApproval.status !== ApprovalStatus.PENDING}
                />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            {selectedApproval?.status === ApprovalStatus.PENDING ? (
              <>
                <Button
                  variant="destructive"
                  onClick={() => void handleReview(ApprovalStatus.REJECTED)}
                  className="flex items-center gap-1"
                >
                  <XCircle className="h-4 w-4" /> Từ chối
                </Button>
                <Button
                  variant="default"
                  onClick={() => void handleReview(ApprovalStatus.APPROVED)}
                  className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-1"
                >
                  <CheckCircle className="h-4 w-4" /> Phê duyệt
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={() => setIsDetailOpen(false)}>
                Thoát
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PermissionGuard>
  );
}
