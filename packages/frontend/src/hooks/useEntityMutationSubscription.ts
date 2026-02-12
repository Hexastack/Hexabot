/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { normalize } from "normalizr";
import { useCallback } from "react";

import { isSameEntity } from "@/hooks/crud/helpers";
import { useTanstackQueryClient } from "@/hooks/crud/useTanstack";
import { ENTITY_MAP } from "@/services/entities";
import { EntityType, QueryType } from "@/services/types";
import { IBaseSchema } from "@/types/base.types";
import { InfiniteData } from "@/types/tanstack.types";
import { useSocketGetQuery, useSubscribe } from "@/websocket/socket-hooks";

type EntityMutationEvent<E extends IBaseSchema = IBaseSchema> = {
  entity: string;
  op: "create" | "update" | "delete";
  data: E;
};

// Builds a stable lookup key from websocket entity names.
const normalizeEntityKey = (entity: string) => {
  return entity.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
};
// Precomputes websocket entity aliases to frontend EntityType values.
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
// Resolves an incoming websocket entity name to a known EntityType.
const resolveEntityType = (entity: unknown): EntityType | null => {
  if (typeof entity !== "string") {
    return null;
  }

  return ENTITY_TYPE_BY_WS_KEY[normalizeEntityKey(entity)] ?? null;
};

type QueryParams = {
  where?: Record<string, unknown>;
};
// Matches count/collection queries for the targeted entity.
const isCountOrCollectionQuery = (
  queryKey: readonly unknown[],
  entity: EntityType,
) => {
  const [qType, qEntity] = queryKey;

  return (
    (qType === QueryType.count || qType === QueryType.collection) &&
    isSameEntity(qEntity, entity)
  );
};
// Safely parses serialized query params from TanStack query keys.
const parseQueryParams = (queryParams: unknown): QueryParams => {
  if (typeof queryParams !== "string") {
    return {};
  }

  try {
    const parsed = JSON.parse(queryParams);

    return typeof parsed === "object" && parsed !== null
      ? (parsed as QueryParams)
      : {};
  } catch {
    return {};
  }
};
// Creates a cache updater that prepends a new id to the first infinite page.
const prependInfiniteFirstPage = (result: unknown) => (oldData: unknown) => {
  if (!oldData) {
    return oldData;
  }

  const data = oldData as InfiniteData<string[]>;
  const [firstPage = [], ...remainingPages] = data.pages;

  return {
    ...data,
    pages: [[result, ...firstPage], ...remainingPages],
  };
};
// Extracts a subscriber id from message payload recipient/sender references.
const getMessageSubscriberId = (data: IBaseSchema) => {
  const payload = data as unknown as { recipient?: unknown; sender?: unknown };
  // Supports both plain string refs and normalized object refs with `id`.
  const getId = (value: unknown) => {
    if (typeof value === "string") {
      return value;
    }

    if (typeof value === "object" && value !== null && "id" in value) {
      const maybeId = (value as { id?: unknown }).id;

      return typeof maybeId === "string" ? maybeId : "";
    }

    return "";
  };

  return getId(payload.recipient) || getId(payload.sender);
};

export const useEntityMutationSubscription = () => {
  const queryClient = useTanstackQueryClient();

  useSocketGetQuery("/entity/subscribe/");

  const handleEntityMutation = useCallback(
    ({ entity: targetEntity, op, data }: EntityMutationEvent) => {
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
          predicate: ({ queryKey }) =>
            isCountOrCollectionQuery(queryKey, entity),
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
          predicate: ({ queryKey }) =>
            isCountOrCollectionQuery(queryKey, entity),
        });
        const updateInfiniteQuery = (
          predicate: (queryKey: readonly unknown[]) => boolean,
        ) => {
          queryClient.setQueriesData(
            {
              predicate: ({ queryKey }) => predicate(queryKey),
            },
            prependInfiniteFirstPage(result),
          );
        };

        if (entity === EntityType.SUBSCRIBER) {
          updateInfiniteQuery((queryKey) => {
            const [qType, qEntity, qParams] = queryKey;

            if (
              qType !== QueryType.infinite ||
              !isSameEntity(qEntity, EntityType.SUBSCRIBER)
            ) {
              return false;
            }

            const params = parseQueryParams(qParams);
            const channelFilter = params.where?.["channel.name"] as
              | { $in?: unknown[] }
              | undefined;

            return !params.where || channelFilter?.["$in"]?.length === 0;
          });
        } else if (entity === EntityType.MESSAGE) {
          const subscriberId = getMessageSubscriberId(data);

          if (subscriberId) {
            updateInfiniteQuery((queryKey) => {
              const [qType, qEntity, qParams] = queryKey;

              if (
                qType !== QueryType.infinite ||
                !isSameEntity(qEntity, EntityType.MESSAGE)
              ) {
                return false;
              }

              const params = parseQueryParams(qParams);
              const filters = params.where?.["or"] as
                | Array<Record<string, string>>
                | undefined;

              return (
                filters?.[0]?.["recipient.id"] === subscriberId &&
                filters?.[1]?.["sender.id"] === subscriberId
              );
            });
          }
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
            return [...collection];
          },
        );
      }
    },
    [queryClient],
  );

  useSubscribe<EntityMutationEvent>("entity", handleEntityMutation);
};
