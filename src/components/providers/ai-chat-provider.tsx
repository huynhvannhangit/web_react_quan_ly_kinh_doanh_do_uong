"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
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

interface AiChatContextType {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  currentId: string | null;
  setCurrentId: (id: string | null) => void;
  createNewChat: () => Conversation;
  deleteConversation: (id: string) => void;
  clearAll: () => void;
  sendMessage: (content: string) => Promise<void>;
  isLoading: boolean;
}

const STORAGE_KEY = "ai_conversations";
const CURRENT_CONV_KEY = "ai_current_conversation_id";

const AiChatContext = createContext<AiChatContextType | undefined>(undefined);

export function AiChatProvider({ children }: { children: React.ReactNode }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load conversations from localStorage only once on mount
  useEffect(() => {
    if (typeof window === "undefined") {
      setIsInitialized(true);
      return;
    }
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
    setIsInitialized(true);
  }, []);

  const saveState = (convs: Conversation[], id: string | null) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(convs));
    if (id) {
      localStorage.setItem(CURRENT_CONV_KEY, id);
    } else {
      localStorage.removeItem(CURRENT_CONV_KEY);
    }
  };

  const currentConversation =
    conversations.find((c) => c.id === currentId) || null;

  const handleSetCurrentId = (id: string | null) => {
    setCurrentId(id);
    saveState(conversations, id);
  };

  const createNewChat = () => {
    const newId = Date.now().toString();
    const newConv: Conversation = {
      id: newId,
      title: "Cuộc trò chuyện mới",
      messages: [],
      updatedAt: new Date().toISOString(),
    };
    const newConvs = [newConv, ...conversations];
    setConversations(newConvs);
    setCurrentId(newId);
    saveState(newConvs, newId);
    return newConv;
  };

  const deleteConversation = (id: string) => {
    const updated = conversations.filter((c) => c.id !== id);
    setConversations(updated);
    let nextId = currentId;
    if (currentId === id) {
      nextId = updated.length > 0 ? updated[0].id : null;
      setCurrentId(nextId);
    }
    saveState(updated, nextId);
  };

  const clearAll = () => {
    setConversations([]);
    setCurrentId(null);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(CURRENT_CONV_KEY);
  };

  const sendMessage = async (content: string) => {
    let targetId = currentId;
    let historyForApi: Message[] = [];

    setIsLoading(true);

    try {
      // 1. Update state for user message
      setConversations((prevConvs) => {
        let currentConvs = prevConvs;
        let targetConv = prevConvs.find((c) => c.id === targetId) || null;

        // If no conversation exists or is selected, create one
        if (!targetConv) {
          const newId = Date.now().toString();
          targetId = newId;
          targetConv = {
            id: newId,
            title: content.slice(0, 30) + (content.length > 30 ? "..." : ""),
            messages: [],
            updatedAt: new Date().toISOString(),
          };
          currentConvs = [targetConv, ...prevConvs];
          setCurrentId(newId);
        }

        const userMessage: Message = {
          role: "user",
          content,
          timestamp: new Date().toISOString(),
        };

        const updatedMessages = [...targetConv.messages, userMessage];
        historyForApi = updatedMessages.slice(-10);

        let newTitle = targetConv.title;
        if (targetConv.messages.length === 0) {
          newTitle = content.slice(0, 30) + (content.length > 30 ? "..." : "");
        }

        const updatedConv = {
          ...targetConv,
          title: newTitle,
          messages: updatedMessages,
          updatedAt: new Date().toISOString(),
        };

        const nextConvs = currentConvs.map((c) =>
          c.id === updatedConv.id ? updatedConv : c
        );
        saveState(nextConvs, targetId);
        return nextConvs;
      });

      // 2. Call API Service
      const response = await aiAssistantService.chat(content, historyForApi);

      const assistantMessage: Message = {
        role: "assistant",
        content: response,
        timestamp: new Date().toISOString(),
      };

      // 3. Update state with assistant response
      setConversations((prevConvs) => {
        const targetConv = prevConvs.find((c) => c.id === targetId);
        if (!targetConv) return prevConvs;

        const finalConv = {
          ...targetConv,
          messages: [...targetConv.messages, assistantMessage],
          updatedAt: new Date().toISOString(),
        };

        const finalConvs = prevConvs.map((c) =>
          c.id === finalConv.id ? finalConv : c
        );
        saveState(finalConvs, targetId);
        return finalConvs;
      });
    } catch (error) {
      console.error("AI Error:", error);
      const errorMessage: Message = {
        role: "assistant",
        content:
          "Xin lỗi, tôi gặp lỗi khi xử lý yêu cầu. Vui lòng thử lại sau.",
        timestamp: new Date().toISOString(),
      };

      setConversations((prevConvs) => {
        const targetConv = prevConvs.find((c) => c.id === targetId);
        if (!targetConv) return prevConvs;

        const errorConv = {
          ...targetConv,
          messages: [...targetConv.messages, errorMessage],
          updatedAt: new Date().toISOString(),
        };

        const errorConvs = prevConvs.map((c) =>
          c.id === errorConv.id ? errorConv : c
        );
        saveState(errorConvs, targetId);
        return errorConvs;
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AiChatContext.Provider
      value={{
        conversations,
        currentConversation,
        currentId,
        setCurrentId: handleSetCurrentId,
        createNewChat,
        deleteConversation,
        clearAll,
        sendMessage,
        isLoading,
      }}
    >
      {isInitialized ? children : null}
    </AiChatContext.Provider>
  );
}

export function useAiChat() {
  const context = useContext(AiChatContext);
  if (context === undefined) {
    throw new Error("useAiChat must be used within an AiChatProvider");
  }
  return context;
}
