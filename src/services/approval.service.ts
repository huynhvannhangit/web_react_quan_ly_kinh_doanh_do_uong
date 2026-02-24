import api from "./api";
import { ApprovalRequest, ReviewApprovalDto } from "../types/approval";

export const approvalService = {
  findAll: async (): Promise<ApprovalRequest[]> => {
    const response = await api.get<{ data: ApprovalRequest[] }>("/approvals");
    return response.data.data;
  },

  findOne: async (id: number): Promise<ApprovalRequest> => {
    const response = await api.get<{ data: ApprovalRequest }>(
      `/approvals/${id}`,
    );
    return response.data.data;
  },

  review: async (
    id: number,
    data: ReviewApprovalDto,
  ): Promise<ApprovalRequest> => {
    const response = await api.patch<{ data: ApprovalRequest }>(
      `/approvals/${id}/review`,
      data,
    );
    return response.data.data;
  },

  remove: async (id: number): Promise<void> => {
    await api.delete(`/approvals/${id}`);
  },
};
