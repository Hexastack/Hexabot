/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { type TooltipProps } from "@mui/material";
import { type LucideIcon } from "lucide-react";

import { type TTranslationKeys } from "@/i18n/i18n.types";
import { EntityType } from "@/services/types";

import { PermissionAction } from "./permission.types";

type TMenuItem = {
  Icon?: LucideIcon;
  text: TTranslationKeys;
  href?: string;
  selected?: boolean;
  onClick?: () => void;
  tooltip?: Partial<TooltipProps>;
  requires?: { [key in EntityType]?: PermissionAction[] };
};

export type TMenu = TMenuItem & {
  submenuItems?: TMenuItem[];
};

export type TSidebarProps = {
  menu: TMenu[];
  pathname: string;
  isToggled?: boolean;
  toggleFunction?: () => void;
};
