// cspell:disable
"use client";

import { Bot, Sparkles, MessageSquare, Clock, ArrowRight } from "lucide-react";
import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Permission } from "@/types";
import { PermissionGuard } from "@/components/shared/PermissionGuard";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const STORAGE_KEY = "ai_chat_history";

// cspell:ignore Thông minh phân tích liệu quản hành thời gian thực Chào mừng Trung chuyện bằng cách nhấn dưới hoặc xanh phải ngay Luôn sàng giải thắc Phân chuyên dụng khuyên kinh doanh thoại Chưa lịch toàn

export default function ChatAiPage() {
  const [history, setHistory] = useState<Message[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        // Wrap in setTimeout to avoid synchronous setState in effect warning
        setTimeout(() => setHistory(data), 0);
      } catch (e) {
        console.error("Failed to load chat history:", e);
      }
    }
  }, []);

  const recentMessages = history.slice(-5).reverse();

  const handleOpenChat = () => {
    window.dispatchEvent(new CustomEvent("open-ai-chat"));
  };

  return (
    <PermissionGuard
      permissions={[Permission.AI_ASSISTANT_CHAT]}
      redirect="/dashboard"
    >
      <Card>
        <CardContent className="p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Bot className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-wide text-[#00509E] dark:text-blue-400 uppercase flex items-center gap-2">
                  Trợ lý AI Thông minh
                  <Sparkles className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                </h1>
                <p className="text-muted-foreground mt-1">
                  Hỗ trợ phân tích dữ liệu và quản lý cửa hàng thời gian thực
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Main Welcome Section */}
            <div className="md:col-span-2 space-y-6">
              <Card className="shadow-sm">
                <CardContent className="p-8 text-center space-y-6">
                  <div className="mx-auto w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                    <Bot className="w-10 h-10 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold">
                      Chào mừng đến với Trung tâm Trợ lý AI
                    </h2>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      Bạn có thể trò chuyện với trợ lý bằng cách nhấn vào nút
                      bên dưới hoặc biểu tượng ở góc phải màn hình.
                    </p>
                  </div>
                  <div className="pt-4 flex justify-center">
                    <Button
                      onClick={handleOpenChat}
                      size="lg"
                      className="gap-2 rounded-full px-8 shadow-md hover:scale-105 transition-transform"
                    >
                      <Sparkles className="w-5 h-5 text-yellow-300 fill-yellow-300" />
                      Bắt đầu trò chuyện ngay!
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card
                  onClick={handleOpenChat}
                  className="cursor-pointer hover:border-primary/50 transition-colors shadow-sm"
                >
                  <CardContent className="p-6">
                    <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center mb-4 text-orange-600 dark:text-orange-400">
                      <MessageSquare className="w-5 h-5" />
                    </div>
                    <h3 className="font-semibold mb-1">Hỗ trợ 24/7</h3>
                    <p className="text-sm text-muted-foreground">
                      Luôn sẵn sàng giải đáp thắc mắc về vận hành cửa hàng.
                    </p>
                  </CardContent>
                </Card>
                <Card
                  onClick={handleOpenChat}
                  className="cursor-pointer hover:border-primary/50 transition-colors shadow-sm"
                >
                  <CardContent className="p-6">
                    <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center mb-4 text-green-600 dark:text-green-400">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <h3 className="font-semibold mb-1">Phân tích chuyên sâu</h3>
                    <p className="text-sm text-muted-foreground">
                      Sử dụng dữ liệu thực tế để đưa ra lời khuyên kinh doanh.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Right Sidebar: Recent History */}
            <div className="space-y-6">
              <Card className="shadow-sm flex flex-col h-full overflow-hidden">
                <CardHeader className="bg-muted/30 border-b p-4">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    Hội thoại gần đây
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-auto p-4">
                  {recentMessages.length > 0 ? (
                    <div className="space-y-4">
                      {recentMessages.map((msg, idx) => (
                        <div
                          key={idx}
                          onClick={handleOpenChat}
                          className={cn(
                            "p-3 rounded-xl border text-sm transition-all hover:bg-muted/50 cursor-pointer hover:border-primary/30",
                            msg.role === "assistant"
                              ? "bg-primary/5 border-primary/10"
                              : "bg-muted/20",
                          )}
                        >
                          <div className="flex items-center gap-2 mb-1.5">
                            {msg.role === "assistant" ? (
                              <Bot className="w-3.5 h-3.5 text-primary" />
                            ) : (
                              <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />
                            )}
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                              {msg.role === "assistant" ? "Trợ lý AI" : "Bạn"}
                            </span>
                          </div>
                          <p className="line-clamp-2 text-foreground/80 leading-snug">
                            {msg.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="h-40 flex flex-col items-center justify-center text-center p-4">
                      <div className="w-10 h-10 rounded-full bg-muted/20 flex items-center justify-center mb-2">
                        <Clock className="w-5 h-5 text-muted-foreground/40" />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Chưa có lịch sử trò chuyện.
                      </p>
                    </div>
                  )}
                </CardContent>
                {history.length > 0 && (
                  <CardFooter className="p-3 border-t bg-muted/5 flex justify-center">
                    <Button
                      variant="link"
                      size="sm"
                      onClick={handleOpenChat}
                      className="text-[11px] font-medium text-primary flex items-center gap-1 w-full justify-center"
                    >
                      Xem toàn bộ lịch sử{" "}
                      <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </CardFooter>
                )}
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>
    </PermissionGuard>
  );
}
