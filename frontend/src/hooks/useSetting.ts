/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

import { useContext } from "react";

import { SettingsContext } from "@/contexts/setting.context";

export const useSetting = (type: string, label: string) => {
  const { settings } = useContext(SettingsContext);
  const value = settings?.[type]?.find(
    (setting) => setting.label === label,
  )?.value;

  return value;
};
