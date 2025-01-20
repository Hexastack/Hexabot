/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import React, { createContext, ReactNode, useContext, useRef } from "react";

import { DEFAULT_CONFIG } from "../constants/defaultConfig";
import { Config } from "../types/config.types";

const ConfigContext = createContext<Config>(DEFAULT_CONFIG);

export const ConfigProvider: React.FC<
  Partial<Config> & {
    children: ReactNode;
  }
> = ({ children, ...providedConfig }) => {
  const config = useRef<Config>({
    ...DEFAULT_CONFIG,
    ...providedConfig,
  });

  return (
    <ConfigContext.Provider value={config.current}>
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfig = () => {
  const context = useContext(ConfigContext);

  if (!context) {
    throw new Error("useConfig must be used within a ConfigProvider");
  }

  return context;
};
