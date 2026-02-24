"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  systemConfigService,
  SystemConfig,
} from "@/services/system-config.service";

interface SystemConfigContextType {
  config: SystemConfig | null;
  isLoading: boolean;
  refreshConfig: () => Promise<void>;
}

const SystemConfigContext = createContext<SystemConfigContextType | undefined>(
  undefined,
);

export function SystemConfigProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchConfig = async () => {
    try {
      setIsLoading(true);
      const data = await systemConfigService.get();
      setConfig(data);
    } catch (error) {
      console.error("Failed to fetch system config:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  return (
    <SystemConfigContext.Provider
      value={{ config, isLoading, refreshConfig: fetchConfig }}
    >
      {children}
    </SystemConfigContext.Provider>
  );
}

export function useSystemConfig() {
  const context = useContext(SystemConfigContext);
  if (context === undefined) {
    throw new Error(
      "useSystemConfig must be used within a SystemConfigProvider",
    );
  }
  return context;
}
