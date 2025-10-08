/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import React, { createContext, ReactNode, useContext } from "react";

import colors from "../constants/colors";
import { ColorState } from "../types/colors.types";

import { useSettings } from "./SettingsProvider";

const initialState: ColorState = colors["orange"];
const ColorContext = createContext<{
  colors: ColorState;
}>({
  colors: initialState,
});

export const ColorProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const settings = useSettings();

  return (
    <ColorContext.Provider value={{ colors: colors[settings.color] }}>
      {children}
    </ColorContext.Provider>
  );
};

export const useColors = () => {
  const context = useContext(ColorContext);

  if (!context) {
    throw new Error("useColors must be used within a ColorProvider");
  }

  return context;
};
