/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 * 3. SaaS Restriction: This software, or any derivative of it, may not be used to offer a competing product or service (SaaS) without prior written consent from Hexastack. Offering the software as a service or using it in a commercial cloud environment without express permission is strictly prohibited.
 */

import { createContext, ReactNode, useContext } from "react";

import { Progress } from "@/app-components/displays/Progress";
import { ISetting } from "@/types/setting.types";

import { useLoadSettings } from "./entities/auth-hooks";

const SettingsContext = createContext<{
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

export const useSetting = (type: string, label: string) => {
  const { settings } = useContext(SettingsContext);
  const value = settings?.[type]?.find(
    (setting) => setting.label === label,
  )?.value;

  return value;
};
