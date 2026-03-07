// cspell:disable
"use client";

import {
  Bot,
  Sparkles,
  MessageSquare,
  Clock,
  Plus,
  Trash2,
  Send,
  User,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import React, { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Permission } from "@/types";
import { PermissionGuard } from "@/components/shared/PermissionGuard";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { useAiChat } from "@/hooks/use-ai-chat";
import { useAuth } from "@/components/providers/auth-provider";
import { useSystemConfig } from "@/components/providers/system-config-provider";
import { getImageUrl, getAvatarUrl } from "@/utils/url";
import Image from "next/image";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";

export default function ChatAiPage() {
  const {
    conversations,
    currentConversation,
    currentId,
    setCurrentId,
    createNewChat,
    deleteConversation,
    clearAll,
    sendMessage,
    isLoading,
  } = useAiChat();

  const { user } = useAuth();
  const { config } = useSystemConfig();
  const [input, setInput] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Modal states
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingTitle, setDeletingTitle] = useState("");

  // Auto scroll to bottom
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

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    setInput("");
    await sendMessage(trimmed);
  };

  return (
    <PermissionGuard
      permissions={[Permission.AI_ASSISTANT_CHAT]}
      redirect="/dashboard"
    >
      <div className="flex h-[calc(100vh-120px)] w-full overflow-hidden bg-background relative mt-2">
        {/* Sidebar */}
        <aside
          className={cn(
            "flex flex-col bg-muted/10 transition-all duration-300",
            sidebarOpen ? "w-72" : "w-0 overflow-hidden",
          )}
        >
          <div className="p-4 flex items-center justify-between shrink-0">
            <h2 className="font-bold text-[#00509E] flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Lịch sử chat
            </h2>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
              onClick={() => setConfirmClearOpen(true)}
              title="Xóa tất cả"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>

          <div className="px-3 pb-2 shrink-0">
            <Button
              onClick={createNewChat}
              className="w-full justify-start gap-2 bg-primary/10 text-primary hover:bg-primary/20"
              variant="outline"
            >
              <Plus className="w-4 h-4" />
              Cuộc trò chuyện mới
            </Button>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-3 space-y-1">
              {conversations.length === 0 ? (
                <div className="py-10 text-center text-muted-foreground">
                  <p className="text-xs">Chưa có lịch sử.</p>
                </div>
              ) : (
                conversations.map((conv) => (
                  <div
                    key={conv.id}
                    className={cn(
                      "group relative flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm transition-all cursor-pointer",
                      currentId === conv.id
                        ? "bg-primary/10 text-primary font-medium"
                        : "hover:bg-muted text-muted-foreground hover:text-foreground",
                    )}
                    onClick={() => setCurrentId(conv.id)}
                  >
                    <MessageSquare
                      className={cn(
                        "w-4 h-4 shrink-0",
                        currentId === conv.id
                          ? "text-primary"
                          : "text-muted-foreground",
                      )}
                    />
                    <span className="truncate flex-1 pr-6">{conv.title}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 opacity-0 group-hover:opacity-100 h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-transparent"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletingId(conv.id);
                        setDeletingTitle(conv.title);
                        setConfirmDeleteOpen(true);
                      }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </aside>

        {/* Main Chat Area */}
        <main className="relative flex flex-1 flex-col overflow-hidden bg-background">
          {/* Header */}
          <header className="flex h-16 items-center gap-2 px-4 bg-background/50 backdrop-blur-sm shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="h-9 w-9 shrink-0 text-muted-foreground hover:text-primary"
              title={sidebarOpen ? "Đóng lịch sử" : "Mở lịch sử"}
            >
              {sidebarOpen ? (
                <ChevronLeft className="h-5 w-5" />
              ) : (
                <ChevronRight className="h-5 w-5" />
              )}
            </Button>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary overflow-hidden relative">
                {config?.logoUrl ? (
                  <Image
                    src={getImageUrl(config.logoUrl)}
                    alt="AI Logo"
                    fill
                    className="object-contain p-1.5"
                  />
                ) : (
                  <Bot className="h-5 w-5" />
                )}
              </div>
              <div>
                <h1 className="text-base font-bold text-[#00509E] dark:text-blue-400 leading-none">
                  Trợ lý AI Quản lý
                </h1>
                <p className="text-[10px] text-green-500 font-medium mt-1 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></span>
                  Trực tuyến & Sẵn sàng
                </p>
              </div>
            </div>
          </header>

          {/* Messages */}
          <ScrollArea className="flex-1 p-6" ref={scrollAreaRef}>
            {!currentConversation ||
            currentConversation.messages.length === 0 ? (
              <div className="flex h-100 flex-col items-center justify-center text-center space-y-6">
                <div className="p-4 rounded-3xl bg-primary/5 ring-8 ring-primary/2 overflow-hidden relative h-24 w-24">
                  {config?.logoUrl ? (
                    <Image
                      src={getImageUrl(config.logoUrl)}
                      alt="AI Logo"
                      fill
                      className="object-contain p-2"
                    />
                  ) : (
                    <Bot className="h-16 w-16 text-primary animate-bounce-subtle" />
                  )}
                </div>
                <div className="max-w-md space-y-2">
                  <h2 className="text-2xl font-bold tracking-tight">
                    Xin chào! Tôi có thể giúp gì cho bạn?
                  </h2>
                  <p className="text-muted-foreground">
                    Tôi có thể giúp bạn phân tích dữ liệu bán hàng, quản lý nhân
                    viên, hoặc đưa ra các đề xuất tối ưu hóa cửa hàng của bạn.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 w-full max-w-lg pt-4">
                  {[
                    "Báo cáo doanh thu hôm nay",
                    "Top 5 món bán chạy",
                    "Hiệu suất nhân viên",
                    "Đề xuất menu mới",
                  ].map((suggest) => (
                    <button
                      key={suggest}
                      onClick={() => {
                        setInput(suggest);
                        handleSend();
                      }}
                      className="text-left p-3 rounded-xl bg-muted/30 hover:bg-primary/5 transition-all text-sm group"
                    >
                      <span className="text-muted-foreground group-hover:text-primary transition-colors">
                        {suggest}
                      </span>
                      <ChevronDown className="w-3.5 h-3.5 -rotate-90 inline ml-2 text-transparent group-hover:text-primary transition-all" />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mx-auto max-w-3xl space-y-6">
                {currentConversation.messages.map((m, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "flex gap-4 animate-in fade-in slide-in-from-bottom-3 duration-300",
                      m.role === "user" ? "flex-row-reverse" : "flex-row",
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-lg shadow-sm overflow-hidden relative",
                        m.role === "assistant"
                          ? "bg-primary/10 text-primary"
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
                        "relative max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-sm leading-relaxed",
                        m.role === "assistant"
                          ? "bg-muted/50 text-foreground rounded-tl-none"
                          : "bg-[#00509E] text-white rounded-tr-none",
                      )}
                    >
                      <div className="whitespace-pre-wrap">{m.content}</div>
                      <span
                        className={cn(
                          "block text-[10px] mt-1.5 opacity-60",
                          m.role === "assistant"
                            ? "text-muted-foreground"
                            : "text-white",
                        )}
                      >
                        {new Date(m.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex gap-4">
                    <div className="bg-primary text-primary-foreground flex h-8 w-8 shrink-0 items-center justify-center rounded-lg shadow-sm">
                      <Bot className="h-4 w-4 active-pulse" />
                    </div>
                    <div className="bg-muted/50 rounded-2xl px-4 py-3 rounded-tl-none flex items-center gap-3">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                      <span className="text-xs text-muted-foreground font-medium italic">
                        Trợ lý đang phân tích dữ liệu...
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>

          {/* Footer Input */}
          <footer className="p-4 bg-background shrink-0">
            <div className="mx-auto max-w-3xl">
              <div className="relative flex items-center">
                <Input
                  placeholder="Gửi tin nhắn cho Trợ lý AI..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  className="flex-1 rounded-2xl border-none focus-visible:ring-0 focus-visible:ring-offset-0 h-13 pr-14 pl-5 shadow-sm bg-muted/30"
                />
                <Button
                  size="icon"
                  onClick={handleSend}
                  disabled={isLoading || !input.trim()}
                  className="absolute right-2 h-9 w-9 rounded-xl shadow-md transition-all active:scale-90"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <p className="mt-3 text-[10px] text-center text-muted-foreground flex items-center justify-center gap-1.5">
                <Sparkles className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                AI có thể cung cấp thông tin không chính xác. Hãy kiểm tra lại
                dữ liệu quan trọng.
              </p>
            </div>
          </footer>
        </main>
      </div>

      <ConfirmDialog
        isOpen={confirmClearOpen}
        onClose={() => setConfirmClearOpen(false)}
        onConfirm={() => {
          clearAll();
          setConfirmClearOpen(false);
        }}
        title="Xóa tất cả lịch sử"
        description="Bạn có chắc chắn muốn xóa toàn bộ lịch sử trò chuyện? Hành động này không thể hoàn tác."
        confirmText="Xóa tất cả"
        isDanger
      />

      <ConfirmDialog
        isOpen={confirmDeleteOpen}
        onClose={() => {
          setConfirmDeleteOpen(false);
          setDeletingId(null);
        }}
        onConfirm={() => {
          if (deletingId) {
            deleteConversation(deletingId);
          }
          setConfirmDeleteOpen(false);
          setDeletingId(null);
        }}
        title="Xóa cuộc trò chuyện"
        description={`Bạn có chắc chắn muốn xóa cuộc trò chuyện "${deletingTitle}"?`}
        confirmText="Xóa"
        isDanger
      />
    </PermissionGuard>
  );
}
