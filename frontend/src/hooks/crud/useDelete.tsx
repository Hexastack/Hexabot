/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 * 3. SaaS Restriction: This software, or any derivative of it, may not be used to offer a competing product or service (SaaS) without prior written consent from Hexastack. Offering the software as a service or using it in a commercial cloud environment without express permission is strictly prohibited.
 */

import { useMutation, useQueryClient } from "react-query";

import { QueryType, TMutationOptions } from "@/services/types";
import {
  IBaseSchema,
  IDynamicProps,
  IEntityMapTypes,
  TType,
} from "@/types/base.types";

import { isSameEntity } from "./helpers";
import { useEntityApiClient } from "../useApiClient";

export const useDelete = <
  TEntity extends IDynamicProps["entity"],
  TAttr = TType<TEntity>["attributes"],
  TBasic extends IBaseSchema = TType<TEntity>["basic"],
  TFull extends IBaseSchema = TType<TEntity>["full"],
>(
  entity: TEntity,
  options?: Omit<
    TMutationOptions<string, Error, string, TBasic>,
    "mutationFn" | "mutationKey"
  > & {
    invalidate?: boolean;
  },
) => {
  const api = useEntityApiClient<TAttr, TBasic, TFull>(entity);
  const queryClient = useQueryClient();
  const { invalidate = true, ...otherOptions } = options || {};

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await api.delete(id);

      queryClient.removeQueries({
        predicate: ({ queryKey }) => {
          const [qType, qEntity, qId] = queryKey;

          return (
            qType === QueryType.item &&
            isSameEntity(qEntity, entity) &&
            qId === id
          );
        },
      });

      // Invalidate all counts & collections
      if (invalidate) {
        queryClient.invalidateQueries({
          predicate: ({ queryKey }) => {
            const [qType, qEntity] = queryKey;

            return (
              (qType === QueryType.count || qType === QueryType.collection) &&
              isSameEntity(qEntity, entity)
            );
          },
        });
      }

      return result;
    },
    ...otherOptions,
  });
};

export const useDeleteFromCache = <E extends keyof IEntityMapTypes>(
  entity: E,
) => {
  const queryClient = useQueryClient();

  return (id: string) => {
    queryClient.removeQueries({
      predicate: ({ queryKey }) => {
        const [qType, qEntity, qId] = queryKey;

        return qType === QueryType.item && qEntity === entity && qId === id;
      },
    });
  };
};
