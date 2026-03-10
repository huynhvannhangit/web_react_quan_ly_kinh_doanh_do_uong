// cspell:disable
"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Bell,
  CheckCircle2,
  Trash2,
  Filter,
  Eye,
  Calendar,
  Clock,
  Inbox,
  Loader2,
} from "lucide-react";
import {
  notificationService,
  Notification,
} from "@/services/notification.service";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { vi } from "date-fns/locale";

import { Permission } from "@/types";
import { PermissionGuard } from "@/components/shared/PermissionGuard";

export default function NotificationPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [selectedNotif, setSelectedNotif] = useState<Notification | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const data = await notificationService.findAll(1, 100);
      setNotifications(data.items);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
      toast.error("Không thể tải danh sách thông báo");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAsRead = async (id: number) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
      // Also update context if possible (hook normally handles it via socket/firebase,
      // but we might need a way to trigger a re-sync or manually update)
      // Actually the local state here is enough for the page.
      toast.success("Đã đánh dấu đã đọc");
    } catch {
      toast.error("Thao tác thất bại");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      toast.success("Đã đánh dấu tất cả là đã đọc");
    } catch {
      toast.error("Thao tác thất bại");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await notificationService.delete(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      toast.success("Đã xóa thông báo");
    } catch (err) {
      console.error("Failed to delete notification:", err);
      toast.error("Không thể xóa thông báo");
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === "unread") return !n.isRead;
    if (filter === "read") return n.isRead;
    return true;
  });

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
    <PermissionGuard
      permissions={[Permission.NOTIFICATION_SEARCH]}
      redirect="/dashboard"
    >
      <div className="p-6 space-y-6 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-xl">
                <Bell className="w-8 h-8 text-primary" />
              </div>
              Tất cả thông báo
            </h1>
            <p className="text-muted-foreground mt-1 text-lg">
              Quản lý và xem lại lịch sử các thông báo trong hệ thống.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={fetchNotifications}
              disabled={loading}
              className="rounded-xl"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Làm mới"
              )}
            </Button>
            <Button
              onClick={handleMarkAllAsRead}
              className="bg-primary hover:bg-primary/90 rounded-xl shadow-lg shadow-primary/20"
            >
              Đánh dấu đọc tất cả
            </Button>
          </div>
        </div>

        <Card className="border-none shadow-xl shadow-slate-200/50 dark:shadow-none bg-white/80 dark:bg-slate-900/50 backdrop-blur-xl rounded-3xl overflow-hidden">
          <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <Select value={filter} onValueChange={setFilter}>
                  <SelectTrigger className="w-45 bg-white dark:bg-slate-800 rounded-xl">
                    <SelectValue placeholder="Lọc thông báo" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="all">Tất cả thông báo</SelectItem>
                    <SelectItem value="unread">Chưa đọc</SelectItem>
                    <SelectItem value="read">Đã đọc</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="text-sm font-medium text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full">
                Tổng số: {filteredNotifications.length} thông báo
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/50 dark:bg-slate-800/50">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-20 text-center">STT</TableHead>
                    <TableHead className="w-37.5">Loại</TableHead>
                    <TableHead className="min-w-75">Nội dung</TableHead>
                    <TableHead className="w-45">Thời gian</TableHead>
                    <TableHead className="w-25 text-center">
                      Trạng thái
                    </TableHead>
                    <TableHead className="w-37.5 text-right">
                      Thao tác
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell colSpan={6} className="h-16 text-center">
                          <div className="flex items-center justify-center gap-2 text-muted-foreground">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Đang tải dữ liệu...
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : filteredNotifications.length === 0 ? (
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
                    filteredNotifications.map((notif, index) => (
                      <TableRow
                        key={notif.id}
                        className={`group transition-colors duration-300 ${!notif.isRead ? "bg-primary/2 border-l-4 border-l-primary" : ""}`}
                      >
                        <TableCell className="text-center font-medium text-slate-500">
                          {index + 1}
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
                              className={`text-sm ${!notif.isRead ? "font-bold text-slate-900 dark:text-slate-100" : "font-medium text-slate-700 dark:text-slate-300"}`}
                            >
                              {notif.title}
                            </span>
                            <span className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                              {notif.message}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm font-medium text-slate-600 dark:text-slate-400">
                          <div className="flex flex-col gap-0.5">
                            <span className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5" />
                              {format(new Date(notif.createdAt), "dd/MM/yyyy")}
                            </span>
                            <span className="flex items-center gap-1.5 opacity-60">
                              <Clock className="w-3.5 h-3.5" />
                              {format(new Date(notif.createdAt), "HH:mm")}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {notif.isRead ? (
                            <div className="flex items-center justify-center">
                              <div className="w-2 h-2 rounded-full bg-slate-200 dark:bg-slate-700" />
                            </div>
                          ) : (
                            <div className="flex items-center justify-center">
                              <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setSelectedNotif(notif)}
                              className="h-9 w-9 text-blue-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                            >
                              <Eye className="w-4.5 h-4.5" />
                            </Button>
                            {!notif.isRead && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleMarkAsRead(notif.id)}
                                className="h-9 w-9 text-green-500 hover:text-green-600 hover:bg-green-50 rounded-lg"
                              >
                                <CheckCircle2 className="w-4.5 h-4.5" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(notif.id)}
                              className="h-9 w-9 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                            >
                              <Trash2 className="w-4.5 h-4.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Notification Detail Dialog */}
        <Dialog
          open={!!selectedNotif}
          onOpenChange={(open) => {
            if (!open) setSelectedNotif(null);
          }}
        >
          <DialogContent className="max-w-xl rounded-3xl border-none shadow-2xl p-0 overflow-hidden">
            {selectedNotif && (
              <div className="flex flex-col">
                <div
                  className={`p-8 ${selectedNotif.isRead ? "bg-slate-50 dark:bg-slate-800/40" : "bg-primary/5"}`}
                >
                  <DialogHeader>
                    <div className="flex justify-between items-start">
                      <Badge
                        variant="outline"
                        className={`rounded-full px-4 py-1.5 mb-4 ${getTypeColor(selectedNotif.type)}`}
                      >
                        {getTypeName(selectedNotif.type)}
                      </Badge>
                    </div>
                    <DialogTitle className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                      {selectedNotif.title}
                    </DialogTitle>
                    <DialogDescription className="text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-4">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" />
                        {format(
                          new Date(selectedNotif.createdAt),
                          "iiii, do MMMM yyyy",
                          { locale: vi },
                        )}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        {format(new Date(selectedNotif.createdAt), "HH:mm")}
                      </span>
                    </DialogDescription>
                  </DialogHeader>
                </div>

                <div className="p-8 pb-10 space-y-6">
                  <div className="bg-slate-100/50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200/50 dark:border-slate-700/50">
                    <p className="text-lg leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-medium">
                      {selectedNotif.message}
                    </p>
                  </div>

                  {selectedNotif.data && (
                    <div className="pt-2">
                      <h4 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-3">
                        Dữ liệu chi tiết
                      </h4>
                      <pre className="bg-slate-900 text-slate-300 p-4 rounded-xl overflow-auto text-xs font-mono border border-slate-800">
                        {JSON.stringify(selectedNotif.data, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>

                <DialogFooter className="p-6 bg-slate-50 dark:bg-slate-800/20 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex justify-end gap-3 w-full">
                    {!selectedNotif.isRead && (
                      <Button
                        onClick={() => {
                          handleMarkAsRead(selectedNotif.id);
                          setSelectedNotif(null);
                        }}
                        className="bg-green-600 hover:bg-green-700 text-white rounded-xl"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Đánh dấu đã đọc
                      </Button>
                    )}
                    <Button
                      variant="secondary"
                      onClick={() => setSelectedNotif(null)}
                      className="rounded-xl px-8"
                    >
                      Đóng
                    </Button>
                  </div>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </PermissionGuard>
  );
}
