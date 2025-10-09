/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { createContext, useMemo } from "react";

import { parseEnvBoolean, parseEnvNumber } from "@/utils/env";

export const ConfigContext = createContext<IConfig | null>(null);

export interface IConfig {
  apiUrl: string;
  ssoEnabled: boolean;
  maxUploadSize: number;
}

export const ConfigProvider = ({ children }) => {
  const config = useMemo<IConfig>(() => {
    const MB = 1024 * 1024;

    return {
      apiUrl:
        import.meta.env.VITE_API_ORIGIN?.toString() || "http://localhost:4000",
      ssoEnabled: parseEnvBoolean(
        import.meta.env.VITE_SSO_ENABLED?.toString(),
        false,
      ),
      maxUploadSize: parseEnvNumber(
        import.meta.env.VITE_UPLOAD_MAX_SIZE_IN_BYTES?.toString(),
        20 * MB,
      ),
    };
  }, []);

  return (
    <ConfigContext.Provider value={config}>{children}</ConfigContext.Provider>
  );
};
