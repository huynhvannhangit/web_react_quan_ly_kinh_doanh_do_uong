// cspell:disable
"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Send } from "lucide-react";

interface ApprovalReasonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actionTitle: string;
  isLoading?: boolean;
  onConfirm: (reason: string) => void;
}

export function ApprovalReasonDialog({
  open,
  onOpenChange,
  actionTitle,
  isLoading = false,
  onConfirm,
}: ApprovalReasonDialogProps) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  const handleConfirm = () => {
    if (!reason.trim()) {
      setError("Vui lòng nhập lý do yêu cầu.");
      return;
    }
    setError("");
    onConfirm(reason.trim());
  };

  const handleOpenChange = (v: boolean) => {
    if (!v) {
      setReason("");
      setError("");
    }
    onOpenChange(v);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Gửi yêu cầu phê duyệt
          </DialogTitle>
          <DialogDescription>
            Yêu cầu này sẽ được gửi đến quản trị viên để xem xét và phê duyệt.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">
            Yêu cầu{" "}
            <span className="font-semibold text-foreground">{actionTitle}</span>{" "}
            sẽ được gửi đến admin để phê duyệt. Vui lòng nhập lý do bên dưới.
          </p>

          <div className="space-y-2">
            <Label htmlFor="approval-reason">
              Lý do yêu cầu <span className="text-destructive">*</span>
            </Label>
            <textarea
              id="approval-reason"
              className="flex min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Mô tả lý do và nội dung thay đổi..."
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (e.target.value.trim()) setError("");
              }}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isLoading}
          >
            Hủy
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading || !reason.trim()}
            className="flex items-center gap-1"
          >
            <Send className="h-4 w-4" />
            {isLoading ? "Đang gửi..." : "Gửi yêu cầu"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
