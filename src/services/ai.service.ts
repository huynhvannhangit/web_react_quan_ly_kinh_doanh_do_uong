import api from "./api";

export interface ChatResponse {
  message: string;
}

export const aiAssistantService = {
  chat: async (message: string) => {
    const response = await api.post<{ data: string }>("/ai-assistant/chat", {
      message,
    });
    return response.data.data;
  },
};
