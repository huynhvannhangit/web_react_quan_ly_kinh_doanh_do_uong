"use client";

import React, { createContext, useContext, ReactNode } from "react";
import { useSocket, AppNotification } from "@/hooks/useSocket";
import { Socket } from "socket.io-client";

interface NotificationContextType {
  socket: Socket | null;
  isConnected: boolean;
  notifications: AppNotification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined,
);

import { useAuth } from "@/components/providers/auth-provider";

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const socketData = useSocket(user);

  return (
    <NotificationContext.Provider value={socketData}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotificationContext = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotificationContext must be used within a NotificationProvider",
    );
  }
  return context;
};
