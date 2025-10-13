/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { createContext, useEffect, useState } from "react";

export const ConfigContext = createContext<IConfig | null>(null);

export interface IConfig {
  apiUrl: string;
  ssoEnabled: boolean;
  maxUploadSize: number;
}

export const ConfigProvider = ({ children }) => {
  const [config, setConfig] = useState<IConfig | null>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch("/config");
        const data = (await res.json()) as IConfig;

        setConfig(data);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Failed to fetch configuration:", error);
      }
    };

    fetchConfig();
  }, []);

  if (!config) {
    // You can return a loader here if you want
    return null;
  }

  return (
    <ConfigContext.Provider value={config}>{children}</ConfigContext.Provider>
  );
};
