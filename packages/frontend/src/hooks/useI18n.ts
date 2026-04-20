/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { useCallback } from "react";

import { EntityType, QueryType } from "@/services/types";

import { useTanstackQueryClient } from "./crud/useTanstack";
import { useTranslate } from "./useTranslate";

export const useI18n = () => {
  const { i18n } = useTranslate();
  const queryClient = useTanstackQueryClient();
  const updateI18nLanguage = useCallback(
    async (lang: string) => {
      const activeLanguage = i18n.resolvedLanguage || i18n.language;

      if (!lang || activeLanguage === lang) {
        return;
      }

      await i18n.changeLanguage(lang);
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: [QueryType.item, "getSettingSchemas"],
        }),
        queryClient.invalidateQueries({
          queryKey: [QueryType.collection, EntityType.WORKFLOW_ACTIONS],
        }),
        queryClient.invalidateQueries({
          queryKey: ["workflow-bindings"],
        }),
      ]);
    },
    [i18n],
  );

  return {
    updateI18nLanguage,
  };
};
