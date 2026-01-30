/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { CircularProgress, Grid, Typography } from "@mui/material";
import { createContext, useEffect, useState } from "react";

import { useTranslate } from "@/hooks/useTranslate";
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

let timer;

export const ConfigProvider = ({ children }) => {
  const { t } = useTranslate();
  const [config, setConfig] = useState<IConfig | null>(null);
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    const loadConfig = async (reload: boolean = false) => {
      try {
        clearInterval(timer);
        const res = await fetch(`${defaultConfig.apiUrl}/config`);
        const data = (await res.json()) as IConfig;

        setConfig(data);

        if (reload) {
          window.location.reload();
        }
      } catch (error) {
        setError(true);
        // eslint-disable-next-line no-console
        console.error("Failed to fetch configuration:", error);

        timer = setInterval(async () => {
          loadConfig(true);
        }, 2000);
      }
    };

    loadConfig();
  }, []);

  if (error || !config) {
    return (
      <Grid
        container
        gap="10px"
        height="100%"
        bgcolor="#F5F6FA"
        position="fixed"
        alignItems="center"
        justifyContent="center"
        flexDirection="column"
        width="100%"
      >
        <CircularProgress />
        <Typography display="block">{t("message.wait_message")} ...</Typography>
      </Grid>
    );
  }

  return (
    <ConfigContext.Provider value={config}>{children}</ConfigContext.Provider>
  );
};
