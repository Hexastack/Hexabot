/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { ColorState } from "../types/colors.types";

export type ThemeMode = "light" | "dark" | "system";
export type ThemeResolvedMode = "light" | "dark";
export type ThemePaletteKey = "orange" | "red" | "green" | "blue" | "teal" | "dark";

export type ThemePalette = {
  key: ThemePaletteKey;
  primary: string;
  onPrimary: string;
  primaryHover: string;
  accent: string;
  onAccent: string;
  success: string;
  warning: string;
  danger: string;
  info: string;
};

export type ThemeTypography = {
  fontFamily: string;
  fontSizeBase: string;
  fontSizeSm: string;
  fontSizeLg: string;
  fontWeightRegular: number;
  fontWeightMedium: number;
  lineHeight: number;
};

export type ThemeSemanticTokens = {
  surface: {
    root: string;
    panel: string;
    header: string;
    input: string;
    sentMessage: string;
    receivedMessage: string;
    menu: string;
    overlay: string;
    elevated: string;
    suggestion: string;
    webviewFooter: string;
  };
  text: {
    primary: string;
    secondary: string;
    inverse: string;
    muted: string;
    onPrimary: string;
    link: string;
  };
  border: {
    subtle: string;
    strong: string;
    interactive: string;
  };
  state: {
    error: string;
    success: string;
    warning: string;
    info: string;
    typing: string;
    typingActive: string;
    disabled: string;
  };
  interactive: {
    launcher: string;
    launcherIcon: string;
    badgeBackground: string;
    badgeText: string;
    buttonPrimaryBg: string;
    buttonPrimaryText: string;
    buttonPrimaryHover: string;
    buttonSecondaryBg: string;
    buttonSecondaryText: string;
    buttonSecondaryHover: string;
    icon: string;
    iconMuted: string;
    iconStrong: string;
    focusRing: string;
  };
  shadow: {
    widget: string;
    elevated: string;
    overlay: string;
  };
};

export type WidgetTheme = {
  mode: ThemeMode;
  resolvedMode: ThemeResolvedMode;
  palette: ThemePalette;
  typography: ThemeTypography;
  tokens: ThemeSemanticTokens;
  colors: ColorState;
};

export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends Record<string, unknown>
    ? DeepPartial<T[K]>
    : T[K];
};

export type ThemeOverrides = {
  mode?: ThemeMode;
  palette?: string;
  typography?: DeepPartial<ThemeTypography>;
  tokens?: DeepPartial<ThemeSemanticTokens>;
};

export type ThemeResolutionInput = {
  configTheme?: ThemeOverrides;
  configThemeColor?: string;
  settingsTheme?: ThemeOverrides;
  settingsThemeColor?: string;
  prefersDarkMode?: boolean;
};
