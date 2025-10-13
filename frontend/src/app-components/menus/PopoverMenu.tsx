/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  Divider,
  MenuItem,
  Popover,
  PopoverProps,
  Stack,
  Typography,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import Link from "next/link";
import { FC } from "react";

import { IUser } from "@/types/user.types";
import { SXStyleOptions } from "@/utils/SXStyleOptions";

const ArrowStyle = styled("span")(({ theme }) => ({
  [theme.breakpoints.up("sm")]: {
    top: -7,
    zIndex: 1,
    width: 12,
    right: 20,
    height: 12,
    content: "''",
    position: "absolute",
    borderRadius: "0",
    transform: "rotate(45deg)",
    background: theme.palette.background.paper,
    borderTop: "1px solid #0002",
    borderLeft: "1px solid #0002",
  },
}));
const StyledMenuItem = styled(MenuItem)(({ theme }) => ({
  ...theme.typography.body2,
  borderRadius: 1,
}));
const StyledStack = styled(Stack)(
  SXStyleOptions({
    padding: 1,
  }),
);
const StyledDivider = styled(Divider)(() => ({
  borderStyle: "solid",
}));
const ellipsisEffect = {
  overflow: "hidden",
  whiteSpace: "nowrap",
  textOverflow: "ellipsis",
} as const;
const StyledSubtitleTypography = styled(Typography)(({ theme }) => ({
  ...theme.typography.subtitle1,
  ...ellipsisEffect,
}));
const StyledTypography = styled(Typography)(({ theme }) => ({
  ...theme.typography.body2,
  color: theme.palette.text.secondary,
  ...ellipsisEffect,
}));

type TPopoverMenuItem = { text: string; href: string };

type TPopoverMenuLogoutItem = { text: string; onClick: () => void };

export type PopoverMenuProps = {
  user?: Pick<IUser, "email" | "first_name" | "last_name">;
  links?: TPopoverMenuItem[];
  logout?: TPopoverMenuLogoutItem;
  handleClose?: () => void;
} & PopoverProps;

export const PopoverMenu: FC<PopoverMenuProps> = ({
  sx,
  user,
  links,
  logout,
  handleClose = () => {},
  ...other
}) => {
  return (
    <Popover
      anchorOrigin={{
        vertical: "bottom",
        horizontal: "right",
      }}
      transformOrigin={{
        vertical: "top",
        horizontal: "right",
      }}
      PaperProps={{
        sx: {
          mt: 1.5,
          ml: 0.8,
          width: 220,
          borderRadius: 1.5,
          overflow: "inherit",
          border: "1px solid #0002",
          ...sx,
        },
      }}
      {...other}
    >
      <ArrowStyle />

      <StyledStack
        spacing={0.5}
        sx={{
          paddingX: 2,
          paddingY: 0.5,
        }}
      >
        <StyledStack spacing={0.5}>
          {user?.first_name && user?.last_name ? (
            <StyledSubtitleTypography>
              {user.first_name} {user.last_name}
            </StyledSubtitleTypography>
          ) : null}
          {user?.email ? (
            <StyledTypography>{user.email}</StyledTypography>
          ) : null}
        </StyledStack>
      </StyledStack>

      {links ? (
        <>
          <StyledDivider />

          <StyledStack>
            {links.map(({ href, text }) => (
              <Link key={text} color="inherit" href={href}>
                <StyledMenuItem onClick={handleClose}>{text}</StyledMenuItem>
              </Link>
            ))}
          </StyledStack>
        </>
      ) : null}

      {logout ? (
        <>
          <StyledDivider />
          <StyledStack spacing={0.5}>
            <StyledMenuItem onClick={logout.onClick}>
              {logout.text}
            </StyledMenuItem>
          </StyledStack>
        </>
      ) : null}
    </Popover>
  );
};
