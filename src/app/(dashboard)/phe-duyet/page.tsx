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
const typeLabels: Record<ApprovalType, string> = {
  [ApprovalType.INVOICE_CANCEL]: "Huỷ hoá đơn",
  [ApprovalType.INVOICE_MERGE]: "Gộp hoá đơn",
  [ApprovalType.PRODUCT_DELETE]: "Xoá sản phẩm",
  [ApprovalType.EMPLOYEE_DELETE]: "Xoá nhân viên",
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
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Chi tiết yêu cầu phê duyệt</DialogTitle>
            </DialogHeader>
            {selectedRequest && (
              <div className="grid gap-4 py-4">
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
                </div>

                <div>
                  <Label className="text-muted-foreground">Lý do yêu cầu</Label>
                  <div className="mt-1 p-2 bg-muted rounded-md text-sm italic">
                    &quot;{selectedRequest.reason || "Không có lý do"}&quot;
                  </div>
                </div>

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
