/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Box from "@mui/material/Box";
import Collapse from "@mui/material/Collapse";
import Grow from "@mui/material/Grow";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Paper from "@mui/material/Paper";
import { type Theme, SxProps } from "@mui/material/styles";
import type {} from "@mui/material/themeCssVarsAugmentation";
import Typography from "@mui/material/Typography";
import * as React from "react";
import { Link } from "react-router-dom";

import { useDashboardSidebar } from "./hooks/useDashboardSidebar";
import { ICON_WIDTH } from "./measurements.constansts";
import { DashboardSidebarProvider } from "./providers/DashboardSidebarProvider";
import { DashboardSidebarPageItemProps } from "./types/sidebar.types";

export const DashboardSidebarPageItem = ({
  id,
  title,
  icon,
  href,
  action,
  defaultExpanded = false,
  expanded = defaultExpanded,
  selected = false,
  disabled = false,
  nestedNavigation,
}: DashboardSidebarPageItemProps) => {
  const { onPageItemClick, mini, fullyExpanded, fullyCollapsed } =
    useDashboardSidebar();
  const [isHovered, setIsHovered] = React.useState(false);
  const hasSub = !!nestedNavigation;
  const submenuAnchorName = `--dashboard-sidebar-item-${React.useId().replaceAll(
    ":",
    "",
  )}`;
  const isExternal = href?.startsWith("http");
  const LinkComp = isExternal ? "a" : Link;
  const handleClick = () => onPageItemClick?.(id, hasSub);
  const arrowSx: SxProps<Theme> =
    mini && fullyCollapsed
      ? {
          position: "absolute",
          top: "41.5%",
          right: 0,
          transform: "translateY(-25%) rotate(-90deg)",
          fontSize: 18,
        }
      : !mini && fullyExpanded
        ? {
            ml: 0.5,
            fontSize: 20,
            transform: `rotate(${expanded ? 0 : -90}deg)`,
            transition: "transform 0.1s",
          }
        : { display: "none" };

  return (
    <>
      <ListItem
        sx={{
          px: mini ? 0 : 1,
          anchorName: mini ? submenuAnchorName : undefined,
        }}
        disablePadding
        onMouseEnter={() => hasSub && mini && setIsHovered(true)}
        onMouseLeave={() => hasSub && mini && setIsHovered(false)}
      >
        <ListItemButton
          selected={selected}
          disabled={disabled}
          onClick={handleClick}
          {...(!hasSub && {
            component: LinkComp,
            to: href,
            ...(isExternal && { target: "_blank", rel: "noopener" }),
          })}
          sx={{
            height: mini ? 50 : "auto",
            justifyContent: "center",
          }}
        >
          {(icon || mini) && (
            <Box
              sx={{
                position: mini ? "relative" : "initial",
              }}
            >
              <ListItemIcon
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  width: ICON_WIDTH,
                  color: selected ? "primary.main" : "currentColor",
                }}
              >
                {icon}
              </ListItemIcon>
              {mini && expanded && (
                <Typography
                  variant="caption"
                  sx={{
                    position: "absolute",
                    bottom: -18,
                    left: "50%",
                    transform: "translateX(-50%)",
                    fontSize: 10,
                    fontWeight: 500,
                  }}
                >
                  {title}
                </Typography>
              )}
            </Box>
          )}

          {!mini && (
            <ListItemText
              primary={title}
              sx={{
                whiteSpace: "nowrap",
                zIndex: 1,
                color: selected ? "primary.main" : "currentColor",
              }}
            />
          )}

          {action && !mini && fullyExpanded && action}
          {hasSub && <ExpandMoreIcon sx={arrowSx} />}
        </ListItemButton>

        {hasSub && mini && (
          <Grow in={isHovered}>
            <Box
              sx={{
                position: "fixed",
                positionAnchor: submenuAnchorName,
                top: "anchor(top)",
                left: "calc(anchor(right) + 8px)",
              }}
            >
              <Paper elevation={8}>
                <DashboardSidebarProvider
                  {...{
                    onPageItemClick,
                    mini: false,
                    fullyExpanded: true,
                    fullyCollapsed: false,
                    hasDrawerTransitions: false,
                  }}
                >
                  {nestedNavigation}
                </DashboardSidebarProvider>
              </Paper>
            </Box>
          </Grow>
        )}
      </ListItem>

      {hasSub && !mini && (
        <Collapse in={expanded} timeout="auto" unmountOnExit>
          {nestedNavigation}
        </Collapse>
      )}
    </>
  );
};
