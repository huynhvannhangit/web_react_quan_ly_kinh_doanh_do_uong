import api from "./api";

export interface ChatResponse {
  message: string;
}

export interface ApiResponse<T> {
  code: number;
  status: boolean;
  message: string;
  data: T;
}

export const aiAssistantService = {
  chat: async (
    message: string,
    history: { role: string; content: string }[] = [],
  ) => {
    const response = await api.post<ApiResponse<string>>("/ai-assistant/chat", {
      message,
      history: history.map((h) => ({
        role: h.role,
        content: h.content,
      })),
    });
    return response.data.data;
  },
};
