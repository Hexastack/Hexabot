/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import React, { createContext, ReactNode, useContext } from "react";

import { DEFAULT_CONFIG } from "../constants/defaultConfig";
import { Config } from "../types/config.types";

const ConfigContext = createContext<Config>(DEFAULT_CONFIG);

export const ConfigProvider: React.FC<
  Partial<Config> & {
    children: ReactNode;
  }
> = ({ children, ...providedConfig }) => {
  const config: Config = {
    ...DEFAULT_CONFIG,
    ...providedConfig,
  };

  return (
    <ConfigContext.Provider value={config}>{children}</ConfigContext.Provider>
  );
};

export const useConfig = () => {
  const context = useContext(ConfigContext);

  if (!context) {
    throw new Error("useConfig must be used within a ConfigProvider");
  }

  return context;
};
