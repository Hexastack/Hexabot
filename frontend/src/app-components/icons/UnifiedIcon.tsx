/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
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
const StyledFontAwesomeIcon = styled(FontAwesomeIcon)(SXStyleOptions({}));

export const UnifiedIcon = ({
  Icon,
  color = "#fff",
  size = "24px",
  isNested = false,
  isToggled = false,
}: {
  Icon: TMenuItem["Icon"];
  color?: string;
  size?: string;
  isNested?: boolean;
  isToggled?: boolean;
}) => {
  return (
    <>
      {Icon && !("icon" in Icon) ? (
        <StyledListItemIcon isNested={isNested} isToggled={isToggled}>
          <Icon sx={{ fontSize: size, color }} />
        </StyledListItemIcon>
      ) : null}
      {Icon && "icon" in Icon ? (
        <StyledListItemIcon isNested={isNested} isToggled={isToggled}>
          <StyledFontAwesomeIcon
            sx={{
              color,
              minWidth: "24px",
              fontSize: `calc(${size} - 5px)`,
              marginTop: "3px",
            }}
            icon={Icon}
          />
        </StyledListItemIcon>
      ) : null}
    </>
  );
};
