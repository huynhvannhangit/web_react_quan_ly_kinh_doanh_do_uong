// cspell:disable
"use client";

import React, { useState } from "react";
import {
  Trash2,
  Eye,
  Inbox,
  RotateCcw,
} from "lucide-react";
import { Pagination } from "@/components/shared/Pagination";
import {
  notificationService,
} from "@/services/notification.service";
import { AppNotification } from "@/hooks/useSocket";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useNotificationContext } from "@/components/providers/notification-provider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { format } from "date-fns";


export default function NotificationPage() {
  const { notifications, markAsRead, markAllAsRead, refresh } = useNotificationContext();
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("all");
  const [selectedNotif, setSelectedNotif] = useState<AppNotification | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const handleDelete = async (id: string | undefined) => {
    if (!id) return;
    try {
      const numericId = Number(id);
      if (!isNaN(numericId)) {
        await notificationService.delete(numericId);
      }
      toast.success("Đã xóa thông báo");
      // Refresh to ensure sync with context data
      window.location.reload(); 
    } catch (err) {
      console.error("Failed to delete notification:", err);
      toast.error("Không thể xóa thông báo");
    }
  };

  const filteredNotifications = (notifications || [])
    .filter((n) => {
      if (filter === "unread") return !n.read;
      if (filter === "read") return n.read;
      return true;
    })
    .sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA;
    });

  const totalPages = Math.ceil(filteredNotifications.length / pageSize);
  const paginatedNotifications = filteredNotifications.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  const globalOffset = (currentPage - 1) * pageSize;

  const getTypeColor = (type: string) => {
    switch (type) {
      case "NEW_ORDER":
        return "bg-blue-500/10 text-blue-600 border-blue-200";
      case "ORDER_STATUS_UPDATED":
        return "bg-purple-500/10 text-purple-600 border-purple-200";
      case "APPROVAL_UPDATED":
        return "bg-amber-500/10 text-amber-600 border-amber-200";
      case "SYSTEM":
        return "bg-slate-500/10 text-slate-600 border-slate-200";
      default:
        return "bg-gray-500/10 text-gray-600 border-gray-200";
    }
  };

  const getTypeName = (type: string) => {
    switch (type) {
      case "NEW_ORDER":
        return "Đơn hàng mới";
      case "ORDER_STATUS_UPDATED":
        return "Trạng thái đơn";
      case "APPROVAL_UPDATED":
        return "Phê duyệt";
      case "SYSTEM":
        return "Hệ thống";
      default:
        return "Thông báo";
    }
  };

  return (
    <>
      <Card>
        <CardContent className="p-8 space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold tracking-wide text-[#00509E] dark:text-blue-400 uppercase">
              Thông báo
            </h1>
          </div>

          <div className="flex flex-wrap items-end justify-between mt-6 w-full gap-4">
            <div className="flex-1 flex justify-end items-end gap-2 mb-0.5 min-w-fit">
              <Button
                variant="outline"
                onClick={async () => {
                  setLoading(true);
                  try {
                    await refresh();
                    toast.success("Đã làm mới danh sách");
                  } catch (err) {
                    console.error("Refresh failed:", err);
                    toast.error("Không thể làm mới");
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
                className="gap-2 rounded-lg"
              >
                <RotateCcw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                Làm mới
              </Button>

              <Button
                onClick={() => {
                  markAllAsRead();
                  toast.success("Đã đánh dấu tất cả là đã đọc");
                }}
                className="bg-[#00509E] hover:bg-[#00509E]/90 text-white rounded-lg"
              >
                Đã đọc tất cả
              </Button>
            </div>
          </div>

          <Card className="border-none shadow-none">
            <CardHeader className="flex flex-row items-center justify-between pb-4 px-0">
              <CardTitle className="text-lg font-semibold text-foreground">
                Danh sách thông báo
              </CardTitle>
              <div className="flex items-center gap-4">
                <div className="text-sm font-medium text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full">
                  Tổng số: {filteredNotifications.length} thông báo
                </div>
                <Select
                  value={filter}
                  onValueChange={(v) => {
                    setFilter(v);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-45 bg-white dark:bg-slate-800 rounded-lg">
                    <SelectValue placeholder="Lọc thông báo" />
                  </SelectTrigger>
                  <SelectContent className="rounded-lg">
                    <SelectItem value="all">Tất cả thông báo</SelectItem>
                    <SelectItem value="unread">Chưa đọc</SelectItem>
                    <SelectItem value="read">Đã đọc</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="px-0">
              <div className="overflow-x-auto [&_th]:bg-muted [&_th]:text-muted-foreground [&_th]:font-semibold [&_td]:py-4">
                <Table className="min-w-325 font-sans">
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-border">
                      <TableHead className="w-16 text-center">STT</TableHead>
                      <TableHead className="w-37.5">Loại</TableHead>
                      <TableHead>Nội dung</TableHead>
                      <TableHead className="w-45">Thời gian</TableHead>
                      <TableHead className="w-25 text-center">Trạng thái</TableHead>
                      <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {false ? ( // Context doesn't expose loading yet, so we assume no long loading state for now
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-12">
                          <div className="flex flex-col items-center gap-2 text-muted-foreground">
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                            Đang tải dữ liệu...
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : paginatedNotifications.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-64 text-center">
                        <div className="flex flex-col items-center justify-center space-y-3 opacity-40">
                          <Inbox className="w-16 h-16" />
                          <p className="text-lg font-medium">
                            Không tìm thấy thông báo nào
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                      paginatedNotifications.map((notif, index) => (
                        <TableRow
                          key={notif.id}
                          className={`hover:bg-muted/50 transition-all duration-300 border-border cursor-pointer ${
                            !notif.read ? "bg-blue-50/30 dark:bg-blue-900/10 font-medium" : ""
                          }`}
                          onClick={async () => {
                            setSelectedNotif(notif);
                            if (!notif.read && notif.id) {
                              markAsRead(notif.id);
                            }
                          }}
                        >
                          <TableCell className="text-center font-medium text-slate-500">
                            {globalOffset + index + 1}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`rounded-full px-3 py-0.5 ${getTypeColor(notif.type)}`}
                            >
                              {getTypeName(notif.type)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span
                                className={`text-sm ${!notif.read ? "font-bold text-slate-900 dark:text-slate-100" : "font-medium text-slate-700 dark:text-slate-300"}`}
                              >
                                {notif.title}
                              </span>
                              <span className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                                {notif.message}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap py-4">
                            {notif.createdAt && !isNaN(new Date(notif.createdAt).getTime())
                              ? format(new Date(notif.createdAt), "HH:mm dd/MM/yyyy")
                              : "N/A"}
                          </TableCell>
                          <TableCell className="text-center">
                            {!notif.read ? (
                              <span className="flex h-2.5 w-2.5 rounded-full bg-blue-600 mx-auto shadow-[0_0_8px_rgba(37,99,235,0.5)]" />
                            ) : (
                              <span className="flex h-2 w-2 rounded-full bg-slate-200 dark:bg-slate-700 mx-auto" />
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                                <button
                                  className="p-2 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                  onClick={(e) => {
                                    e.stopPropagation(); // Avoid double triggering row click
                                    setSelectedNotif(notif);
                                    if (!notif.read && notif.id) markAsRead(notif.id);
                                  }}
                                  title="Xem chi tiết"
                                >
                                  <Eye className="h-4 w-4" />
                                </button>
                                <button
                                  className="p-2 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(notif.id);
                                  }}
                                  title="Xóa"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
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
                totalItems={filteredNotifications.length}
                onPageChange={setCurrentPage}
              />
            </CardContent>
          </Card>
        </CardContent>
      </Card>

        {/* Notification Detail Dialog */}
        <Dialog
          open={!!selectedNotif}
          onOpenChange={(open) => {
            if (!open) setSelectedNotif(null);
          }}
        >
          <DialogContent className="sm:max-w-md">
            {selectedNotif && (
              <>
                <DialogHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge
                      variant="outline"
                      className={`rounded-full px-3 py-0.5 ${getTypeColor(selectedNotif.type)}`}
                    >
                      {getTypeName(selectedNotif.type)}
                    </Badge>
                  </div>
                  <DialogTitle className="text-xl font-bold">
                    {selectedNotif.title}
                  </DialogTitle>
                  <DialogDescription className="text-muted-foreground mt-1.5">
                    {selectedNotif.createdAt && !isNaN(new Date(selectedNotif.createdAt).getTime())
                      ? format(new Date(selectedNotif.createdAt), "HH:mm dd/MM/yyyy")
                      : "N/A"}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div className="bg-muted/30 p-4 rounded-lg border border-border/50">
                    <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap font-medium">
                      {selectedNotif.message}
                    </p>
                  </div>

                  {/* Removed raw JSON display as it's not user-friendly */}
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setSelectedNotif(null)}
                    className="rounded-lg px-6"
                  >
                    Đóng
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
    </>
  );
}
