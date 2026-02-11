/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Box, Grid, useMediaQuery } from "@mui/material";
import { normalize } from "normalizr";
import React, { useCallback } from "react";

import { HexabotLogo } from "@/app-components/logos/HexabotLogo";
import { DashboardHeader } from "@/app-components/menus/DashboardSidebar/DashboardHeader";
import { DashboardSidebar } from "@/app-components/menus/DashboardSidebar/DashboardSidebar";
import { isSameEntity } from "@/hooks/crud/helpers";
import { useTanstackQueryClient } from "@/hooks/crud/useTanstack";
import useAvailableMenuItems from "@/hooks/useAvailableMenuItems";
import { useConfig } from "@/hooks/useConfig";
import { ENTITY_MAP } from "@/services/entities";
import { EntityType, QueryType } from "@/services/types";
import { IBaseSchema } from "@/types/base.types";
import { InfiniteData } from "@/types/tanstack.types";
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

  const handleEntityMutation = useCallback(
    async ({ entity: targetEntity, op, data }: EntityMutationEvent) => {
      const entity = resolveEntityType(targetEntity);

      if (!entity || !(entity in ENTITY_MAP)) {
        return;
      }

      if (op === "delete") {
        const id = data.id;

        if (!id) {
          return;
        }

        queryClient.removeQueries({
          queryKey: [QueryType.item, entity, id],
          exact: true,
        });

        queryClient.refetchQueries({
          predicate: ({ queryKey }) => {
            const [qType, qEntity] = queryKey;

            return (
              (qType === QueryType.count || qType === QueryType.collection) &&
              isSameEntity(qEntity, entity)
            );
          },
        });

        return;
      }

      const schemaEntity = ENTITY_MAP[entity];
      const { result, entities } = normalize(
        data,
        Array.isArray(data) ? [schemaEntity] : schemaEntity,
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
          );
        });
      });

      if (op === "create") {
        queryClient.refetchQueries({
          predicate: ({ queryKey }) => {
            const [qType, qEntity] = queryKey;

            return (
              (qType === QueryType.count || qType === QueryType.collection) &&
              isSameEntity(qEntity, entity)
            );
          },
        });
        // @todo : enhance this logic
        if (entity === EntityType.SUBSCRIBER) {
          // Inbox : Only update the unfiltered (all-subscribers) cache
          queryClient.setQueriesData(
            {
              predicate: ({ queryKey }) => {
                const [qType, qEntity, qParams] = queryKey;

                if (
                  qType === QueryType.infinite &&
                  isSameEntity(qEntity, EntityType.SUBSCRIBER)
                ) {
                  const params = JSON.parse(String(qParams));

                  return (
                    !params.where ||
                    params.where?.["channel.name"]?.["$in"]?.length === 0
                  );
                }

                return false;
              },
            },
            (oldData) => {
              if (oldData) {
                const data = oldData as InfiniteData<string[]>;

                return {
                  ...data,
                  pages: [[result, ...data.pages[0]], ...data.pages.slice(1)],
                };
              }

              return oldData;
            },
          );
        } else if (entity === EntityType.MESSAGE) {
          queryClient.setQueriesData(
            {
              predicate: ({ queryKey }) => {
                const [qType, qEntity, qParams] = queryKey;

                if (
                  qType === QueryType.infinite &&
                  isSameEntity(qEntity, EntityType.MESSAGE)
                ) {
                  const params = JSON.parse(String(qParams));
                  const subscriberId =
                    "recipient" in data
                      ? data.recipient
                      : "sender" in data
                        ? data.sender
                        : "";

                  return (
                    subscriberId &&
                    params.where?.["or"]?.[0]?.["recipient.id"] ===
                      subscriberId &&
                    params.where?.["or"]?.[1]?.["sender.id"] === subscriberId
                  );
                }

                return false;
              },
            },
            (oldData) => {
              if (oldData) {
                const data = oldData as InfiniteData<string[]>;

                return {
                  ...data,
                  pages: [[result, ...data.pages[0]], ...data.pages.slice(1)],
                };
              }

              return oldData;
            },
          );
        }
      } else {
        queryClient.setQueriesData(
          {
            predicate({ queryKey }) {
              const [qType, qEntity] = queryKey;

              return (
                qType === QueryType.collection && isSameEntity(qEntity, entity)
              );
            },
          },
          (collection: unknown[]) => {
            return [...collection, undefined];
          },
        );
      }
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
