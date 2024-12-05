/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { createHash } from "crypto";

import { ChannelSettings } from "../providers/SettingsProvider";

export const truncate = (s: string, length = 100) => {
  return s.length > length ? s.substr(0, length) + "..." : s;
};

export const linebreak = (s: string) => {
  return s.replace(/\n/g, "<br />");
};

export const processContent = (s: string) => {
  let result = truncate(s, 50);

  result = linebreak(s);

  return result;
};

export const generateUUIDFromString = (str: string) => {
  const hash = createHash("sha256").update(str).digest("hex");

  return hash.replace(/(.{8})(.{4})(.{4})(.{4})(.+)/, "$1-$2-$3-$4-$5");
};

type TChannel = "console_channel";
type TSetting = {
  group: TChannel;
  label: keyof ChannelSettings;
  value?: string;
};
type TSettings = Record<string, TSetting[]>;
type TCriterion = {
  group: TSetting["group"];
  label: TSetting["label"];
  selectedField: keyof TSetting;
};

export const extractSettingValue = (
  settings: TSettings,
  criterion: TCriterion
) =>
  settings?.[criterion.group]?.find(
    (setting) => setting.label === criterion.label
  )?.[criterion?.selectedField];

export const extractSettingValues = (
  settings: TSettings,
  criteria: TCriterion[]
) => criteria.map((criterion) => extractSettingValue(settings, criterion));
