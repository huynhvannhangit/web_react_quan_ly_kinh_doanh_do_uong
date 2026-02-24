"use client";

import React, { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { aiAssistantService } from "@/services/ai.service";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import {
  MessageSquare,
  Send,
  Bot,
  User,
  Loader2,
  Sparkles,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "Báo cáo doanh thu hôm nay",
  "Top 5 sản phẩm bán chạy nhất",
  "Cửa hàng hiện có bao nhiêu bàn?",
  "Lời khuyên tăng doanh thu?",
];

const STORAGE_KEY = "ai_chat_history";

export function AiAssistantChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Auto open if on chat routes
  useEffect(() => {
    if (pathname === "/chat-ai") {
      setIsOpen(true);
    }
  }, [pathname]);

  // Listen for global open event
  useEffect(() => {
    const handleOpen = () => {
      setIsOpen(true);
    };

    window.addEventListener("open-ai-chat", handleOpen);
    return () => window.removeEventListener("open-ai-chat", handleOpen);
  }, []);

  // Load history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setMessages(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load chat history:", e);
      }
    } else {
      setMessages([
        {
          role: "assistant",
          content:
            "Xin chào! Tôi là trợ lý AI quản lý cửa hàng. Tôi có thể giúp gì cho bạn hôm nay?",
        },
      ]);
    }
  }, []);

  // Save history to localStorage
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    }
  }, [messages]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]",
      );
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages, isLoading]);

  const handleSend = async (textOverride?: string) => {
    const messageToSend = textOverride || input.trim();
    if (!messageToSend || isLoading) return;

    setInput("");
    const updatedMessages = [
      ...messages,
      { role: "user", content: messageToSend },
    ] as Message[];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      // Prepare history for backend (limit to last 10 messages for context)
      const historyContext = updatedMessages.slice(-11, -1);

      const response = await aiAssistantService.chat(
        messageToSend,
        historyContext,
      );
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: response },
      ]);
    } catch (error) {
      console.error("AI Error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Xin lỗi, tôi gặp lỗi khi xử lý yêu cầu. Vui lòng thử lại sau.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    const defaultMsg: Message[] = [
      {
        role: "assistant",
        content: "Đã xóa lịch sử. Tôi có thể giúp gì mới cho bạn?",
      },
    ];
    setMessages(defaultMsg);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <div className="no-print fixed bottom-6 right-6 z-50">
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button
            size="lg"
            className="rounded-full h-14 w-14 shadow-2xl hover:scale-110 transition-all bg-primary hover:bg-primary/90 group relative"
          >
            <div className="relative">
              <MessageSquare className="h-6 w-6 group-hover:rotate-12 transition-transform" />
              <Sparkles className="h-3 w-3 absolute -top-1 -right-1 text-yellow-400 fill-yellow-400 animate-pulse" />
            </div>
            {messages.length > 1 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] text-white border-2 border-white">
                {messages.length - 1}
              </span>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent className="p-0 border shadow-2xl rounded-t-2xl sm:rounded-2xl w-full sm:max-w-110 h-full sm:h-[80vh] sm:max-h-175 fixed sm:right-6 sm:bottom-6 sm:top-auto flex flex-col overflow-hidden [&>button]:hidden">
          <div className="p-4 border-b bg-primary text-primary-foreground flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <div className="bg-white/20 p-1.5 rounded-full ring-2 ring-white/10 shrink-0">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <SheetTitle className="text-primary-foreground font-semibold text-base leading-none">
                  Trợ lý AI Quản lý
                </SheetTitle>
                <SheetDescription className="sr-only">
                  Trò chuyện với trợ lý ảo để quản lý cửa hàng hiệu quả hơn.
                </SheetDescription>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-white/20 text-white shrink-0"
                onClick={clearChat}
                title="Xóa lịch sử"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-white/20 text-white shrink-0"
                onClick={() => setIsOpen(false)}
                title="Đóng"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
            <div className="space-y-4 pb-4">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "flex gap-3 animate-in fade-in slide-in-from-bottom-2",
                    m.role === "user" ? "flex-row-reverse" : "flex-row",
                  )}
                >
                  <div
                    className={cn(
                      "flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full border shadow-sm",
                      m.role === "assistant"
                        ? "bg-primary text-primary-foreground"
                        : "bg-background text-foreground",
                    )}
                  >
                    {m.role === "assistant" ? (
                      <Bot className="h-4 w-4" />
                    ) : (
                      <User className="h-4 w-4" />
                    )}
                  </div>
                  <div
                    className={cn(
                      "rounded-2xl px-4 py-2.5 text-sm shadow-sm max-w-[85%] whitespace-pre-wrap leading-relaxed",
                      m.role === "assistant"
                        ? "bg-muted/50 text-foreground rounded-tl-none border"
                        : "bg-primary text-primary-foreground rounded-tr-none",
                    )}
                  >
                    {m.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3">
                  <div className="bg-primary text-primary-foreground flex h-8 w-8 shrink-0 items-center justify-center rounded-full shadow-sm">
                    <Bot className="h-4 w-4 animate-pulse" />
                  </div>
                  <div className="bg-muted/50 rounded-2xl px-4 py-2.5 rounded-tl-none border shadow-sm flex items-center gap-2">
                    <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                    <span className="text-xs text-muted-foreground italic">
                      AI đang suy nghĩ...
                    </span>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <footer className="p-4 border-t bg-background">
            <div className="flex flex-wrap gap-2 mb-4">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSend(s)}
                  disabled={isLoading}
                  className="text-[11px] px-2.5 py-1.5 rounded-full border bg-muted/30 hover:bg-primary/10 hover:border-primary/30 transition-colors text-muted-foreground hover:text-primary whitespace-nowrap"
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="flex w-full items-center gap-2">
              <Input
                placeholder="Hỏi bất cứ điều gì..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                className="flex-1 focus-visible:ring-primary h-11"
              />
              <Button
                size="icon"
                onClick={() => handleSend()}
                disabled={isLoading || !input.trim()}
                className="h-11 w-11 shrink-0 shadow-md transition-transform active:scale-95"
              >
                {isLoading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-[10px] text-center text-muted-foreground mt-3">
              AI có thể mắc lỗi. Vui lòng kiểm tra lại các số liệu quan trọng.
            </p>
          </footer>
        </SheetContent>
      </Sheet>
    </div>
  );
}
