/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { ListItemIcon, styled, Theme } from "@mui/material";

import { SXStyleOptions } from "@/utils/SXStyleOptions";

import { TMenuItem } from "../menus/Sidebar";

const StyledListItemIcon = styled(ListItemIcon, {
  shouldForwardProp: (prop) => prop !== "isNested" && prop !== "isToggled",
})(
  ({
    theme,
    isNested,
    isToggled,
  }: {
    isNested: boolean;
    isToggled: boolean;
  } & { theme: Theme }) => {
    return SXStyleOptions({
      color: "#fff",
      minWidth: 0,
      marginRight: isToggled ? "20px" : "0",
      paddingLeft: isNested ? theme?.spacing(3) : 0,
    })({ theme });
  },
);

export const UnifiedIcon = ({
  Icon,
  color = "#fff",
  size = "24px",
  isNested = false,
  isToggled = false,
}: {
  Icon?: TMenuItem["Icon"];
  color?: string;
  size?: number | string;
  isNested?: boolean;
  isToggled?: boolean;
}) => {
  if (!Icon) return null;

  return (
    <StyledListItemIcon isNested={isNested} isToggled={isToggled}>
      <Icon color={color} size={size} />
    </StyledListItemIcon>
  );
};
