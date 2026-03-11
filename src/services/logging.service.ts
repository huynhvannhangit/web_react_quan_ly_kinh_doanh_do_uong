// cspell:disable
import api from "./api";

export interface UserLog {
  id: number;
  userId: number | null;
  action: string;
  module: string | null;
  description: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  user?: {
    id: number;
    username: string;
    fullName?: string;
  } | null;
}

export interface LogQueryParams {
  page?: number;
  limit?: number;
  module?: string;
  action?: string;
  userId?: number;
}

export interface LogResponse {
  data: UserLog[];
  total: number;
  page: number;
  limit: number;
}

export const loggingService = {
  async findAll(params: LogQueryParams = {}): Promise<LogResponse> {
    // Backend wraps response: { code, status, message, data: { data: [], total, page, limit } }
    const response = await api.get<{ data: LogResponse }>("/logging", {
      params,
    });
    return response.data.data;
  },
};
