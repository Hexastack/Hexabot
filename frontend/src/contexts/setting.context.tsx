/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { createContext, ReactNode } from "react";

import { Progress } from "@/app-components/displays/Progress";
import { useLoadSettings } from "@/hooks/entities/auth-hooks";
import { useRemoteI18n } from "@/hooks/useRemoteI18n";
import { ISetting } from "@/types/setting.types";

export const SettingsContext = createContext<{
  settings: { [key: string]: ISetting[] } | undefined;
}>({ settings: undefined });

SettingsContext.displayName = "SettingsContext";

interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider = ({
  children,
}: SettingsProviderProps): JSX.Element => {
  const { data, isLoading } = useLoadSettings();

  // Load API i18n Translations (extensions, ...)
  useRemoteI18n();

  if (isLoading) return <Progress />;

  return (
    <SettingsContext.Provider
      value={{
        settings: data,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};
