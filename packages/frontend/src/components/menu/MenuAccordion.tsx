/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { MenuType, Action } from "@hexabot-ai/types";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  ButtonGroup,
  Link,
  styled,
  Typography,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import {
  Ban,
  ChevronRight,
  Link as LinkIcon,
  ListPlus,
  LucideIcon,
  Pencil,
  Reply,
  Trash2,
} from "lucide-react";
import React, { FC, useState } from "react";

import { AnimatedComponent } from "@/app-components/AnimatedComponent";
import { useGetFromCache } from "@/hooks/crud/useGet";
import { useHasPermission } from "@/hooks/useHasPermission";
import { useTranslate } from "@/hooks/useTranslate";
import { theme } from "@/layout/theme";
import { EntityType } from "@/services/types";
import { IMenuNode } from "@/types/menu-tree.types";
import { SXStyleOptions } from "@/utils/SXStyleOptions";

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
    "& .MuiAccordionSummary-expandIconWrapper": {
      transform: "none !important",
      "&.Mui-expanded": {
        transform: "none !important",
      },
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

const getIcon = (menu: IMenuNode): LucideIcon | undefined => {
  if (menu.type === MenuType.postback) {
    return Reply;
  }
  if (menu.type === MenuType.web_url) return LinkIcon;
  if (menu.type === MenuType.nested && menu.call_to_actions === undefined) {
    return Ban;
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
  const Icon = getIcon(menu);

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
            alignItems: "center",
            justifyContent: "center",
            display:
              menu.type === MenuType.nested &&
              menu.call_to_actions !== undefined
                ? "none"
                : "flex",
          }}
        >
          {Icon ? <Icon /> : null}
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
                color={theme.palette.primary.main}
                href={menu.url}
              >
                ({menu.url})
              </Link>
            </>
          ) : null}
        </Typography>
      </Grid>
      <ButtonGroup size="small">
        {menu.type === "nested" &&
        hasPermission(EntityType.MENU, Action.CREATE) ? (
          <Button
            size="small"
            startIcon={<ListPlus size={18} style={{ opacity: 0.6 }} />}
            onClick={(event) => {
              onAppend(menu.id);
              event.stopPropagation();
            }}
          >
            {t("button.append")}
          </Button>
        ) : null}
        {hasPermission(EntityType.MENU, Action.UPDATE) ? (
          <Button
            startIcon={<Pencil size={18} style={{ opacity: 0.6 }} />}
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
        {hasPermission(EntityType.MENU, Action.DELETE) ? (
          <Button
            onClick={(event) => {
              onDelete(menu);
              event.stopPropagation();
            }}
            startIcon={<Trash2 size={18} color={theme.palette.error.main} />}
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
                <AnimatedComponent
                  component={ChevronRight}
                  canRotate={isExpanded}
                  htmlColor="black"
                  from="0"
                  to="90"
                />
              ) : (
                <AnimatedComponent
                  component={ChevronRight}
                  canRotate={false}
                  htmlColor="black"
                  from="0"
                  to="90"
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
        <Grid height="60px" alignContent="center" sx={{ zIndex: 1 }}>
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
