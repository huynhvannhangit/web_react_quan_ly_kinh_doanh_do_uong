import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { MainContent } from "@/components/layout/MainContent";
import { AiAssistantChat } from "@/components/shared/ai-assistant-chat";
import { AiChatProvider } from "@/components/providers/ai-chat-provider";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AiChatProvider>
      <div className="flex h-screen overflow-hidden bg-background">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Header */}
          <Header />

          {/* Main Content */}
          <MainContent>{children}</MainContent>

          {/* AI Assistant Chat */}
          <AiAssistantChat />
        </div>
      </div>
    </AiChatProvider>
  );
}
