/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { createContext, useEffect, useState } from "react";

import { Progress } from "@/app-components/displays/Progress";
import { parseEnvBoolean, parseEnvNumber } from "@/utils/env";

const MB = 1024 * 1024;
const defaultConfig: IConfig = {
  apiUrl: import.meta.env.VITE_API_ORIGIN ?? "/api",
  ssoEnabled: parseEnvBoolean(import.meta.env.VITE_SSO_ENABLED, false),
  maxUploadSize: parseEnvNumber(
    import.meta.env.VITE_UPLOAD_MAX_SIZE_IN_BYTES,
    20 * MB,
  ),
};

export const ConfigContext = createContext<IConfig | null>(defaultConfig);

export interface IConfig {
  apiUrl: string;
  ssoEnabled: boolean;
  maxUploadSize: number;
}

export const ConfigProvider = ({ children }) => {
  const [config, setConfig] = useState<IConfig | null>(null);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const res = await fetch(`${defaultConfig.apiUrl}/config`);
        const data = (await res.json()) as IConfig;

        setConfig(data);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Failed to fetch configuration:", error);
      }
    };

    loadConfig();
  }, []);

  if (!config) {
    return <Progress size={64} />;
  }

  return (
    <ConfigContext.Provider value={config}>{children}</ConfigContext.Provider>
  );
};
