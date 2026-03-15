"use client";

import React, { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
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
  X,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAiChat } from "@/hooks/use-ai-chat";
import { useAuth } from "@/components/providers/auth-provider";
import { useSystemConfig } from "@/components/providers/system-config-provider";
import { getImageUrl, getAvatarUrl } from "@/utils/url";
import Image from "next/image";

export function AiAssistantChat() {
  const [isOpen, setIsOpen] = useState(false);
  const { currentConversation, sendMessage, isLoading, createNewChat } =
    useAiChat();
  const { user } = useAuth();
  const { config } = useSystemConfig();
  const [input, setInput] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Listen for global open event
  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener("open-ai-chat", handleOpen);
    return () => window.removeEventListener("open-ai-chat", handleOpen);
  }, []);

  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]",
      );
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [currentConversation?.messages, isLoading]);

  const handleSend = async (textOverride?: string) => {
    const messageToSend = textOverride || input.trim();
    if (!messageToSend || isLoading) return;

    setInput("");
    await sendMessage(messageToSend);
  };

  const isChatPage = pathname === "/chat-ai";
  const hasAiPermission = user?.permissions?.includes("AI_ASSISTANT_CHAT");

  // Hide the floating button if on the main chat page, or if user doesn't have permission
  if (isChatPage || !hasAiPermission) return null;

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
            {(currentConversation?.messages.length || 0) > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] text-white border-2 border-white">
                {currentConversation!.messages.length}
              </span>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent className="p-0 border shadow-2xl rounded-t-2xl sm:rounded-2xl w-full sm:max-w-110 h-full sm:h-[80vh] sm:max-h-175 fixed sm:right-6 sm:bottom-6 sm:top-auto flex flex-col overflow-hidden [&>button]:hidden">
          <div className="p-4 border-b bg-primary text-primary-foreground flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <div className="bg-white/20 rounded-full ring-2 ring-white/10 shrink-0 h-8 w-8 relative overflow-hidden flex items-center justify-center">
                {config?.logoUrl ? (
                  <Image
                    src={getImageUrl(config.logoUrl)}
                    alt="AI Logo"
                    fill
                    className="object-contain p-1"
                  />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
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
                onClick={createNewChat}
                title="Thêm mới"
              >
                <Plus className="h-4 w-4" />
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
              {!currentConversation ||
              currentConversation.messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center opacity-60">
                  <div className="p-2 rounded-full bg-primary/10 border border-primary/20 mb-3 relative h-12 w-12 overflow-hidden flex items-center justify-center shrink-0">
                    {config?.logoUrl ? (
                      <Image
                        src={getImageUrl(config.logoUrl)}
                        alt="AI Logo"
                        fill
                        className="object-contain p-2"
                      />
                    ) : (
                      <Bot className="h-6 w-6 text-primary" />
                    )}
                  </div>
                  <p className="text-sm">Bắt đầu trò chuyện với trợ lý AI!</p>
                </div>
              ) : (
                currentConversation.messages.map((m, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "flex gap-3 animate-in fade-in slide-in-from-bottom-2",
                      m.role === "user" ? "flex-row-reverse" : "flex-row",
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full border shadow-sm relative overflow-hidden",
                        m.role === "assistant"
                          ? "bg-primary/10 text-primary border-primary/20"
                          : "bg-background text-foreground",
                      )}
                    >
                      {m.role === "assistant" ? (
                        config?.logoUrl ? (
                          <Image
                            src={getImageUrl(config.logoUrl)}
                            alt="AI"
                            fill
                            className="object-contain p-1"
                          />
                        ) : (
                          <Bot className="h-4 w-4" />
                        )
                      ) : user?.avatar ? (
                        <Image
                          src={getAvatarUrl(user.avatar)}
                          alt="User"
                          fill
                          className="object-cover"
                        />
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
                ))
              )}
              {isLoading && (
                <div className="flex gap-3">
                  <div className="bg-primary/10 text-primary border border-primary/20 flex h-8 w-8 shrink-0 items-center justify-center rounded-full shadow-sm relative overflow-hidden">
                    {config?.logoUrl ? (
                      <Image
                        src={getImageUrl(config.logoUrl)}
                        alt="AI"
                        fill
                        className="object-contain p-1 animate-pulse"
                      />
                    ) : (
                      <Bot className="h-4 w-4 animate-pulse" />
                    )}
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
              {["Báo cáo hôm nay", "Top sản phẩm", "Mật độ bàn"].map((s) => (
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
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </footer>
        </SheetContent>
      </Sheet>
    </div>
  );
}
