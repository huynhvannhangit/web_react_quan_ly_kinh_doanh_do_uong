import { User } from "./index";

export enum ApprovalType {
  INVOICE_CANCEL = "INVOICE_CANCEL",
  INVOICE_MERGE = "INVOICE_MERGE",
  PRODUCT_DELETE = "PRODUCT_DELETE",
  EMPLOYEE_DELETE = "EMPLOYEE_DELETE",
  UPDATE = "UPDATE",
  DELETE = "DELETE",
}

export enum ApprovalStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

export interface ApprovalRequest {
  id: number;
  requestNumber: string;
  type: ApprovalType;
  status: ApprovalStatus;
  requestedBy: User;
  reviewedBy?: User;
  reason: string;
  metadata?: Record<string, unknown>;
  reviewedAt?: string;
  reviewNote?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewApprovalDto {
  status: ApprovalStatus;
  reviewNote?: string;
}
