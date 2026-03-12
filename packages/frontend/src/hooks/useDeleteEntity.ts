/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { BASE_ADD_DIALOG_MAP } from "@/app-components/dialogs/dialog.constants";
import { ConfirmOptions } from "@/types/common/dialogs.types";

import { useDelete } from "./crud/useDelete";
import { useDeleteMany } from "./crud/useDeleteMany";
import { useEntityDialogs } from "./useEntityDialogs";
import { useToast } from "./useToast";
import { useTranslate } from "./useTranslate";

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
    confirmOptions: ConfirmOptions & { ids?: string[] } = {
      mode: "click",
    },
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
