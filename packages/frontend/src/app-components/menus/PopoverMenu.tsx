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
import { FC } from "react";
import { Link as RouterLink } from "react-router-dom";

import { IUser } from "@/types/user.types";
import { SXStyleOptions } from "@/utils/SXStyleOptions";

const StyledStack = styled(Stack)(
  SXStyleOptions({
    padding: 1,
  }),
);

type TPopoverMenuItem = { text: string; href: string };

type TPopoverMenuLogoutItem = { text: string; onClick: () => void };

export type PopoverMenuProps = {
  user?: Pick<IUser, "email" | "firstName" | "lastName">;
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
      slotProps={{
        paper: {
          sx: {
            mt: 1.5,
            ml: 0.8,
            width: 220,
            borderRadius: 1.5,
            overflow: "inherit",
            border: "1px solid #0002",
            ...sx,
          },
        },
      }}
      {...other}
    >
      <StyledStack
        spacing={0.5}
        sx={{
          paddingX: 2,
          paddingY: 0.5,
        }}
      >
        <StyledStack spacing={0.5}>
          {user?.firstName && user?.lastName ? (
            <Typography>
              {user.firstName} {user.lastName}
            </Typography>
          ) : null}
          {user?.email ? (
            <Typography variant="caption" color="gray">
              {user.email}
            </Typography>
          ) : null}
        </StyledStack>
      </StyledStack>

      {links ? (
        <>
          <Divider />

          <StyledStack>
            {links.map(({ href, text }) => (
              <RouterLink key={text} to={href} onClick={handleClose}>
                <MenuItem>{text}</MenuItem>
              </RouterLink>
            ))}
          </StyledStack>
        </>
      ) : null}

      {logout ? (
        <>
          <Divider />
          <StyledStack spacing={0.5}>
            <MenuItem onClick={logout.onClick}>{logout.text}</MenuItem>
          </StyledStack>
        </>
      ) : null}
    </Popover>
  );
};
