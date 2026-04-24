/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { WidgetTheme } from "../theme/theme.types";
import { resolveWidgetTheme, themeToCssVariables } from "../theme/theme.utils";

import "../theme/theme.css";
import { useConfig } from "./ConfigProvider";
import { useSettings } from "./SettingsProvider";

const ThemeContext = createContext<WidgetTheme | undefined>(undefined);
const getSystemPreference = () => {
  if (
    typeof window === "undefined" ||
    typeof window.matchMedia !== "function"
  ) {
    return false;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches;
};
const usePrefersDarkMode = () => {
  const [prefersDarkMode, setPrefersDarkMode] = useState<boolean>(
    getSystemPreference(),
  );

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      typeof window.matchMedia !== "function"
    ) {
      return;
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const updatePreference = () => {
      setPrefersDarkMode(mediaQuery.matches);
    };

    updatePreference();
    mediaQuery.addEventListener("change", updatePreference);

    return () => {
      mediaQuery.removeEventListener("change", updatePreference);
    };
  }, []);

  return prefersDarkMode;
};

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const config = useConfig();
  const settings = useSettings();
  const prefersDarkMode = usePrefersDarkMode();
  const theme = useMemo(() => {
    return resolveWidgetTheme({
      configMode: config.mode,
      configTheme: config.theme,
      primaryColor: config.primaryColor,
      settingsTheme: settings.theme,
      prefersDarkMode,
    });
  }, [
    config.mode,
    config.theme,
    config.primaryColor,
    settings.theme,
    prefersDarkMode,
  ]);
  const cssVariables = useMemo(() => themeToCssVariables(theme), [theme]);

  return (
    <ThemeContext.Provider value={theme}>
      <div
        className="hb-theme-root"
        data-theme-mode={theme.resolvedMode}
        data-theme-primary={theme.palette.primary}
        style={cssVariables}
      >
        {children}
      </div>
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }

  return context;
};
