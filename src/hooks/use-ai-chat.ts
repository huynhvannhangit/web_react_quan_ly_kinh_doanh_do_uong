import { useState, useEffect } from "react";
import { aiAssistantService } from "@/services/ai.service";

export interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: string;
}

const STORAGE_KEY = "ai_conversations";
const CURRENT_CONV_KEY = "ai_current_conversation_id";

export function useAiChat() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load conversations from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const lastId = localStorage.getItem(CURRENT_CONV_KEY);

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setConversations(parsed);
        if (lastId && parsed.find((c: Conversation) => c.id === lastId)) {
          setCurrentId(lastId);
        } else if (parsed.length > 0) {
          setCurrentId(parsed[0].id);
        }
      } catch (e) {
        console.error("Failed to parse conversations", e);
      }
    }
  }, []);

  // Save to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
    if (currentId) {
      localStorage.setItem(CURRENT_CONV_KEY, currentId);
    } else {
      localStorage.removeItem(CURRENT_CONV_KEY);
    }
  }, [conversations, currentId]);

  const currentConversation =
    conversations.find((c) => c.id === currentId) || null;

  const createNewChat = () => {
    const newId = Date.now().toString();
    const newConv: Conversation = {
      id: newId,
      title: "Cuộc trò chuyện mới",
      messages: [],
      updatedAt: new Date().toISOString(),
    };
    setConversations([newConv, ...conversations]);
    setCurrentId(newId);
    return newConv;
  };

  const deleteConversation = (id: string) => {
    const updated = conversations.filter((c) => c.id !== id);
    setConversations(updated);
    if (currentId === id) {
      setCurrentId(updated.length > 0 ? updated[0].id : null);
    }
  };

  const clearAll = () => {
    setConversations([]);
    setCurrentId(null);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(CURRENT_CONV_KEY);
  };

  const sendMessage = async (content: string) => {
    let conv = currentConversation;
    if (!conv) {
      conv = createNewChat();
    }

    const userMessage: Message = {
      role: "user",
      content,
      timestamp: new Date().toISOString(),
    };

    const updatedMessages = [...conv.messages, userMessage];

    // Update title based on first message
    let newTitle = conv.title;
    if (conv.messages.length === 0) {
      newTitle = content.slice(0, 30) + (content.length > 30 ? "..." : "");
    }

    const updatedConv = {
      ...conv,
      title: newTitle,
      messages: updatedMessages,
      updatedAt: new Date().toISOString(),
    };

    setConversations((prev) =>
      prev.map((c) => (c.id === updatedConv.id ? updatedConv : c)),
    );

    setIsLoading(true);
    try {
      const historyContext = updatedMessages.slice(-10);
      const response = await aiAssistantService.chat(content, historyContext);

      const assistantMessage: Message = {
        role: "assistant",
        content: response,
        timestamp: new Date().toISOString(),
      };

      const finalConv = {
        ...updatedConv,
        messages: [...updatedMessages, assistantMessage],
        updatedAt: new Date().toISOString(),
      };

      setConversations((prev) =>
        prev.map((c) => (c.id === finalConv.id ? finalConv : c)),
      );
    } catch (error) {
      console.error("AI Error:", error);
      const errorMessage: Message = {
        role: "assistant",
        content:
          "Xin lỗi, tôi gặp lỗi khi xử lý yêu cầu. Vui lòng thử lại sau.",
        timestamp: new Date().toISOString(),
      };
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === updatedConv.id) {
            return { ...c, messages: [...c.messages, errorMessage] };
          }
          return c;
        }),
      );
    } finally {
      setIsLoading(false);
    }
  };

  return {
    conversations,
    currentConversation,
    currentId,
    setCurrentId,
    createNewChat,
    deleteConversation,
    clearAll,
    sendMessage,
    isLoading,
  };
}
