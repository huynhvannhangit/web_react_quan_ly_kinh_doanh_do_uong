"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { AppNotification } from "@/hooks/useSocket";

interface NotificationDetailModalProps {
  notification: AppNotification | null;
  isOpen: boolean;
  onClose: () => void;
}

const getTypeName = (type: string) => {
  switch (type) {
    case "NEW_ORDER":
      return "Đơn hàng mới";
    case "ORDER_STATUS_UPDATED":
      return "Trạng thái đơn";
    case "NEW_APPROVAL":
    case "APPROVAL_STATUS_UPDATED":
      return "Phê duyệt";
    default:
      return "Thông báo";
  }
};

const getTypeColor = (type: string) => {
  switch (type) {
    case "NEW_ORDER":
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800";
    case "ORDER_STATUS_UPDATED":
      return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800";
    case "NEW_APPROVAL":
    case "APPROVAL_STATUS_UPDATED":
      return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800";
    default:
      return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700";
  }
};

export function NotificationDetailModal({
  notification,
  isOpen,
  onClose,
}: NotificationDetailModalProps) {
  if (!notification) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Badge
              variant="outline"
              className={`rounded-full px-3 py-0.5 ${getTypeColor(notification.type)}`}
            >
              {getTypeName(notification.type)}
            </Badge>
          </div>
          <DialogTitle className="text-xl font-bold">
            {notification.title}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground mt-1.5 text-xs">
            {notification.createdAt && !isNaN(new Date(notification.createdAt).getTime())
              ? format(new Date(notification.createdAt), "HH:mm dd/MM/yyyy")
              : "N/A"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-muted/30 p-4 rounded-lg border border-border/50">
            <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap font-medium">
              {notification.message}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            className="rounded-lg px-6"
          >
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
