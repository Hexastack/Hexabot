/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { ThemeOptions, ThemeProvider } from "@mui/material/styles";
import * as React from "react";

import { theme } from ".";

interface AppThemeProps {
  children: React.ReactNode;
  /**
   * This is for the docs site. You can ignore it or remove it.
   */
  disableCustomTheme?: boolean;
  themeComponents?: ThemeOptions["components"];
}

export default function AppTheme(props: AppThemeProps) {
  const { children, disableCustomTheme, themeComponents } = props;
  const memoizedTheme = React.useMemo(() => {
    return disableCustomTheme ? {} : theme;
  }, [disableCustomTheme, themeComponents]);

  if (disableCustomTheme) {
    return <React.Fragment>{children}</React.Fragment>;
  }

  return (
    <ThemeProvider
      theme={memoizedTheme}
      disableTransitionOnChange
      defaultMode="light"
    >
      {children}
    </ThemeProvider>
  );
}
