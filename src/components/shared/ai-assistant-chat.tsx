"use client";

import React, { useState, useRef, useEffect } from "react";
import { aiAssistantService } from "@/services/ai.service";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import {
  MessageSquare,
  X,
  Send,
  Bot,
  User,
  Loader2,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function AiAssistantChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Xin chào! Tôi là trợ lý AI quản lý cửa hàng. Tôi có thể giúp gì cho bạn hôm nay?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]",
      );
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await aiAssistantService.chat(userMessage);
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

  return (
    <div className="no-print fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {isOpen ? (
        <Card className="w-80 sm:w-96 shadow-2xl border-2 animate-in slide-in-from-bottom-5">
          <CardHeader className="p-4 border-b bg-primary text-primary-foreground rounded-t-lg">
            <CardTitle className="flex items-center justify-between text-base">
              <div className="flex items-center gap-2">
                <div className="bg-white/20 p-1.5 rounded-full">
                  <Sparkles className="h-4 w-4" />
                </div>
                <span>Trợ lý AI Quản lý</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-white/20 text-white"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 bg-muted/30">
            <ScrollArea className="h-100 p-4" ref={scrollAreaRef}>
              <div className="space-y-4">
                {messages.map((m, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "flex gap-3",
                      m.role === "user" ? "flex-row-reverse" : "flex-row",
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full border shadow-sm",
                        m.role === "assistant"
                          ? "bg-primary text-primary-foreground"
                          : "bg-white",
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
                        "rounded-2xl px-4 py-2.5 text-sm shadow-sm max-w-[80%]",
                        m.role === "assistant"
                          ? "bg-white text-foreground rounded-tl-none"
                          : "bg-primary text-primary-foreground rounded-tr-none",
                      )}
                    >
                      {m.content}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex gap-3">
                    <div className="bg-primary text-primary-foreground flex h-8 w-8 shrink-0 items-center justify-center rounded-full">
                      <Bot className="h-4 w-4" />
                    </div>
                    <div className="bg-white rounded-2xl px-4 py-2.5 rounded-tl-none shadow-sm">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
          <CardFooter className="p-4 border-t bg-white rounded-b-lg">
            <div className="flex w-full items-center gap-2">
              <Input
                placeholder="Hỏi bất cứ điều gì..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                className="flex-1 focus-visible:ring-primary"
              />
              <Button
                size="icon"
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardFooter>
        </Card>
      ) : (
        <Button
          size="lg"
          className="rounded-full h-14 w-14 shadow-2xl hover:scale-110 transition-transform bg-primary"
          onClick={() => setIsOpen(true)}
        >
          <MessageSquare className="h-6 w-6" />
        </Button>
      )}
    </div>
  );
}
