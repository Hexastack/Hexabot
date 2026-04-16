/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { BASE_ADD_DIALOG_MAP } from "@/app-components/dialogs/dialog.constants";
import { QueryType, TMutationOptions } from "@/services/types";
import { THook } from "@/types/base.types";
import { type ConfirmOptions } from "@/types/common/dialogs.types";

import { useEntityApiClient } from "../useApiClient";
import { useEntityDialogs } from "../useEntityDialogs";
import { useToast } from "../useToast";
import { useTranslate } from "../useTranslate";

import { useDeleteMany } from "./useDeleteMany";
import { useTanstackMutation, useTanstackQueryClient } from "./useTanstack";

export const useDelete = <
  TE extends THook["entity"],
  TBasic = THook<{ entity: TE }>["basic"],
>(
  entity: TE,
  options?: TMutationOptions<string, Error, string, TBasic>,
) => {
  const api = useEntityApiClient(entity);
  const { routeParams, ...otherOptions } = options || {};

  return useTanstackMutation({
    mutationFn: async (id) => {
      const result = await api.delete(id, routeParams);

      return result;
    },
    ...otherOptions,
  });
};

export const useDeleteFromCache = <TE extends THook["entity"]>(entity: TE) => {
  const queryClient = useTanstackQueryClient();

  return (id: string) => {
    queryClient.removeQueries({
      predicate: ({ queryKey }) => {
        const [qType, qEntity, qId] = queryKey;

        return qType === QueryType.item && qEntity === entity && qId === id;
      },
    });
  };
};

export const useDeleteEntity = <TE extends keyof typeof BASE_ADD_DIALOG_MAP>(
  entity: TE,
) => {
  const { t } = useTranslate();
  const { toast } = useToast();
  const options = {
    onError: () => {
      toast.error(t("message.internal_server_error"));
    },
    onSuccess() {
      toast.success(t("message.item_delete_success"));
    },
  };
  const { mutate: deleteEntity } = useDelete(entity, options);
  const { mutate: deleteEntities } = useDeleteMany(entity, options);
  const entityDialogs = useEntityDialogs(entity);
  const confirmToDeleteEntity = async (
    confirmOptions: ConfirmOptions & { ids?: string[] } = { mode: "click" },
  ) => {
    const { ids = [], mode = "click", ...options } = confirmOptions;

    if (!ids.length) {
      return;
    }
    const isConfirmed = await entityDialogs.confirmDelete({
      ...options,
      mode,
      count: ids.length,
    });

    if (!isConfirmed) {
      return;
    }
    mode === "selection" ? deleteEntities(ids) : deleteEntity(ids[0]);
  };

  return { confirmToDeleteEntity };
};
