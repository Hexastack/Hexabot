/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import DoNotDisturbAltRoundedIcon from "@mui/icons-material/DoNotDisturbAltRounded";
import DriveFileRenameOutlineIcon from "@mui/icons-material/DriveFileRenameOutline";
import LinkIcon from "@mui/icons-material/Link";
import PlaylistAddRoundedIcon from "@mui/icons-material/PlaylistAddRounded";
import ReplyIcon from "@mui/icons-material/Reply";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  ButtonGroup,
  Button,
  Link,
  Typography,
  Grid,
  styled,
} from "@mui/material";
import React, { FC, useState } from "react";

import { AnimatedChevron } from "@/app-components/icons/AnimatedChevron";
import { UnifiedIcon } from "@/app-components/icons/UnifiedIcon";
import { TMenuItem } from "@/app-components/menus/Sidebar";
import { useGetFromCache } from "@/hooks/crud/useGet";
import { useHasPermission } from "@/hooks/useHasPermission";
import { useTranslate } from "@/hooks/useTranslate";
import { theme } from "@/layout/themes/theme";
import { EntityType } from "@/services/types";
import { IMenuNode } from "@/types/menu-tree.types";
import { MenuType } from "@/types/menu.types";
import { PermissionAction } from "@/types/permission.types";
import { SXStyleOptions } from "@/utils/SXStyleOptions";

const StyledButton = styled(Button)(({ theme }) => ({
  borderRadius: "8px",
  color: "inherit",
  fontWeight: 300,
  textTransform: "capitalize",
  backgroundColor: theme.palette.background.default,
  borderColor: theme.palette.action.focus,
  borderWidth: "1px",
  "&:hover": {
    borderColor: theme.palette.action.focus,
  },
}));
const StyledAccordion = styled(Accordion)(
  SXStyleOptions({
    // remove shadow and edges
    "&.MuiAccordion-root": {
      boxShadow: "none",
      "&:before": {
        display: "none",
      },
      "&.Mui-expanded": {
        margin: "0",
      },
      "&.MuiPaper-root": {
        backgroundColor: "transparent",
      },
    },
    "& .MuiAccordionSummary-root": {
      padding: 0,
      gap: 1,
      flexDirection: "row-reverse", //  expand icon to the right
    },
    "& .MuiAccordionDetails-root": {
      padding: "0",
      marginLeft: 1,
    },
  }),
);

interface MenuAccordionProps {
  menu: IMenuNode;
  onAppend: (id: string) => void;
  onUpdate: (menu: IMenuNode) => void;
  onDelete: (menu: IMenuNode) => void;
  level?: number;
}

const getIcon = (menu: IMenuNode): TMenuItem["Icon"] | undefined => {
  if (menu.type === MenuType.postback) {
    return ReplyIcon;
  }
  if (menu.type === MenuType.web_url) return LinkIcon;
  if (menu.type === MenuType.nested && menu.call_to_actions === undefined) {
    return DoNotDisturbAltRoundedIcon;
  }

  return undefined;
};
const MenuItem: FC<MenuAccordionProps> = ({
  menu,
  onAppend,
  onUpdate,
  onDelete,
}) => {
  const { t } = useTranslate();
  const hasPermission = useHasPermission();

  return (
    <Box
      key={menu.id}
      sx={{
        width: "100%",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        zIndex: 1,
      }}
    >
      <Grid
        sx={{
          display: "flex",
          alignItems: "center",
          flexDirection: "row",
          flexShrink: 0,
          width: "max-content",
          maxWidth: "100%",
          gap: 1,
        }}
      >
        {/* The following hack is because the chevron icon is inherently smaller than the 
        other icons. This gives an illusion of uniformity in the icon sizes.
        So we will make the icons smaller manually
        and wrap them in a div with a fixed size.
        */}
        <div
          style={{
            height: "24px",
            width: "24px",
            alignItems: "center",
            justifyContent: "center",
            display:
              menu.type === MenuType.nested &&
              menu.call_to_actions !== undefined
                ? "none"
                : "flex",
          }}
        >
          <UnifiedIcon size="20px" Icon={getIcon(menu)} color="#000" />
        </div>
        <Typography>
          {menu.title} :{" "}
          <span
            style={{
              color: "gray",
              textTransform: "uppercase",
              fontSize: "14px",
              fontWeight: 300,
            }}
          >
            {menu.type}
            {menu.type === "nested"
              ? ` (${menu.call_to_actions?.length || "0"})`
              : ""}
          </span>
          {menu.url ? (
            <>
              <Link
                sx={{ ml: "0.75em", fontSize: "14px" }}
                color={theme.palette.primary.light}
                href={menu.url}
              >
                ({menu.url})
              </Link>
            </>
          ) : null}
        </Typography>
      </Grid>
      <ButtonGroup
        variant="outlined"
        size="small"
        aria-label="editing actions"
        sx={{
          borderRadius: "2px",
          overflow: "hidden",
          height: "32px",
        }}
      >
        {menu.type === "nested" &&
        hasPermission(EntityType.MENU, PermissionAction.CREATE) ? (
          <StyledButton
            startIcon={<PlaylistAddRoundedIcon sx={{ opacity: 0.6 }} />}
            onClick={(event) => {
              onAppend(menu.id);
              event.stopPropagation();
            }}
          >
            {t("button.append")}
          </StyledButton>
        ) : null}
        {hasPermission(EntityType.MENU, PermissionAction.UPDATE) ? (
          <StyledButton
            startIcon={<DriveFileRenameOutlineIcon sx={{ opacity: "60%" }} />}
            onClick={(event) => {
              onUpdate(menu);
              event.stopPropagation();
            }}
            sx={{
              "& .MuiButton-startIcon": {
                marginRight: 0,
              },
            }}
          />
        ) : null}
        {hasPermission(EntityType.MENU, PermissionAction.DELETE) ? (
          <StyledButton
            onClick={(event) => {
              onDelete(menu);
              event.stopPropagation();
            }}
            startIcon={<DeleteOutlineIcon color="error" />}
            sx={{
              "& .MuiButton-startIcon": {
                marginRight: 0,
              },
            }}
          />
        ) : null}
      </ButtonGroup>
    </Box>
  );
};
const MenuAccordion: React.FC<MenuAccordionProps> = ({
  menu,
  onAppend,
  onUpdate,
  onDelete,
  level = 0,
}) => {
  const getMenuItemFromCache = useGetFromCache(EntityType.MENU);
  const [isExpanded, setIsExpanded] = useState(false);
  const toggleExpansion = () => {
    setIsExpanded(() => !isExpanded);
  };

  return (
    <Grid
      sx={{
        ...(level !== 0 && {
          borderLeft: "1px dashed #0003",
          paddingLeft: 2,
        }),
        zIndex: 1,
        position: "relative",
      }}
    >
      {menu.type === "nested" ? (
        <StyledAccordion
          expanded={menu.call_to_actions?.length ? isExpanded : false}
          onChange={toggleExpansion}
          disableGutters={true}
        >
          <AccordionSummary
            expandIcon={
              menu.call_to_actions?.length ? (
                <AnimatedChevron
                  canRotate={isExpanded}
                  htmlColor="black"
                  from="0"
                  to="-90"
                />
              ) : (
                <AnimatedChevron
                  canRotate={false}
                  htmlColor="black"
                  from="0"
                  to="-90"
                />
              )
            }
          >
            <MenuItem
              menu={menu}
              onAppend={onAppend}
              onUpdate={onUpdate}
              onDelete={onDelete}
            />
          </AccordionSummary>
          <AccordionDetails>
            {menu.call_to_actions
              ?.map((id) => getMenuItemFromCache(id))
              .map(
                (submenu, index) =>
                  submenu && (
                    <MenuAccordion
                      key={submenu.id}
                      menu={submenu}
                      onAppend={onAppend}
                      onUpdate={onUpdate}
                      onDelete={onDelete}
                      level={index + 1}
                    />
                  ),
              )}
          </AccordionDetails>
        </StyledAccordion>
      ) : (
        <Grid height="56px" alignContent="center" sx={{ zIndex: 1 }}>
          <MenuItem
            menu={menu}
            onAppend={onAppend}
            onUpdate={onUpdate}
            onDelete={onDelete}
          />
        </Grid>
      )}
    </Grid>
  );
};

export default MenuAccordion;
