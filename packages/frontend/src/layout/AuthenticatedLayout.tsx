/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Box, Grid, useMediaQuery } from "@mui/material";
import { normalize } from "normalizr";
import React from "react";

import { HexabotLogo } from "@/app-components/logos/HexabotLogo";
import { DashboardHeader } from "@/app-components/menus/DashboardSidebar/DashboardHeader";
import { DashboardSidebar } from "@/app-components/menus/DashboardSidebar/DashboardSidebar";
import { useTanstackQueryClient } from "@/hooks/crud/useTanstack";
import useAvailableMenuItems from "@/hooks/useAvailableMenuItems";
import { useConfig } from "@/hooks/useConfig";
import { ENTITY_MAP } from "@/services/entities";
import { EntityType, QueryType } from "@/services/types";
import { IBaseSchema } from "@/types/base.types";
import { getMenuItems } from "@/utils/menu.util";
import { useSocketGetQuery, useSubscribe } from "@/websocket/socket-hooks";

import { LayoutProps } from ".";

import { theme } from "./theme";

type EntityMutationEvent<E extends IBaseSchema = IBaseSchema> = {
  entity: string;
  op: "create" | "update" | "delete";
  data: E;
};

const normalizeEntityKey = (entity: string) => {
  return entity.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
};
const ENTITY_TYPE_BY_WS_KEY = (() => {
  const entityMap: Record<string, EntityType> = {
    stats: EntityType.BOTSTATS,
  };

  Object.values(EntityType).forEach((entityType) => {
    entityMap[normalizeEntityKey(entityType)] = entityType;

    const [baseEntity] = entityType.split("/");
    const normalizedBaseEntity = normalizeEntityKey(baseEntity);

    if (!entityMap[normalizedBaseEntity]) {
      entityMap[normalizedBaseEntity] = entityType;
    }
  });

  return entityMap;
})();
const resolveEntityType = (entity: unknown): EntityType | null => {
  if (typeof entity !== "string") {
    return null;
  }

  return ENTITY_TYPE_BY_WS_KEY[normalizeEntityKey(entity)] ?? null;
};

export const AuthenticatedLayout: React.FC<
  LayoutProps & { hasNoPadding?: boolean }
> = ({ children, hasNoPadding }) => {
  const queryClient = useTanstackQueryClient();

  useSocketGetQuery("/message/subscribe/");

  useSocketGetQuery("/subscriber/subscribe/");

  useSocketGetQuery("/workflow/subscribe/");
  const [isDesktopNavigationExpanded, setIsDesktopNavigationExpanded] =
    React.useState(false);
  const isOverMdViewport = useMediaQuery(theme.breakpoints.up("md"));
  const setIsNavigationExpanded = React.useCallback(
    (newExpanded: boolean) => {
      setIsDesktopNavigationExpanded(newExpanded);
    },
    [isOverMdViewport, setIsDesktopNavigationExpanded],
  );
  const handleToggleHeaderMenu = React.useCallback(
    (isExpanded: boolean) => {
      setIsNavigationExpanded(isExpanded);
    },
    [setIsNavigationExpanded],
  );
  const { ssoEnabled } = useConfig();
  const menuItems = getMenuItems(ssoEnabled);
  const availableMenuItems = useAvailableMenuItems(menuItems);

  useSocketGetQuery("/entity/subscribe/");

  const handleEntityMutation = React.useCallback(
    (payload: EntityMutationEvent) => {
      const entity = resolveEntityType(payload.entity);

      if (!entity) {
        return;
      }

      if (payload.op === "delete") {
        const id = payload.data.id;

        if (!id) {
          return;
        }

        queryClient.removeQueries({
          queryKey: [QueryType.item, entity, id],
          exact: true,
        });

        return;
      }
      if (!(entity in ENTITY_MAP)) {
        return;
      }

      const schemaEntity = ENTITY_MAP[entity];
      const { entities } = normalize(
        payload.data,
        Array.isArray(payload.data) ? [schemaEntity] : schemaEntity,
      );

      Object.entries(entities).forEach(([entityType, dataDict]) => {
        if (!dataDict) {
          return;
        }

        Object.entries(dataDict).forEach(([id, newData]) => {
          if (!id || !newData) {
            return;
          }
          queryClient.setQueryData(
            [QueryType.item, entityType, id],
            (previousData: Record<string, unknown> | undefined) => {
              return {
                ...previousData,
                ...newData,
              };
            },
            {
              updatedAt: newData.updatedAt,
            },
          );
        });
      });
    },
    [queryClient],
  );

  useSubscribe<EntityMutationEvent>("entity", handleEntityMutation);

  return (
    <Box display="flex">
      <DashboardHeader
        logo={<HexabotLogo />}
        menuOpen={isDesktopNavigationExpanded}
        onToggleMenu={handleToggleHeaderMenu}
      />
      <DashboardSidebar
        menu={availableMenuItems}
        expanded={isDesktopNavigationExpanded}
        setExpanded={setIsNavigationExpanded}
      />

      <Grid
        sx={{
          padding: hasNoPadding ? 0 : 3,
          position: "relative",
          marginTop: "64px",
          display: "flex",
          flexDirection: "column",
          flex: 1,
          overflow: "auto",
          width: "calc(100% - 88px)",
          zIndex: 5,
        }}
      >
        {children}
      </Grid>
    </Box>
  );
};
