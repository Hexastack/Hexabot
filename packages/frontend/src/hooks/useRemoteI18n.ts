/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { useEffect } from "react";

import i18n from "@/i18n/config";

import { useTanstackQuery } from "./crud/useTanstack";
import { useApiClient } from "./useApiClient";
import { useAuth } from "./useAuth";

export const useRemoteI18n = () => {
  const { isAuthenticated } = useAuth();
  const { apiClient } = useApiClient();
  const { data: additionalTranslations, isSuccess } = useTanstackQuery({
    queryKey: ["readonly-i18n"],
    queryFn: () => apiClient.fetchRemoteI18n(),
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (isSuccess) {
      for (const namespace in additionalTranslations) {
        const namespaceData = additionalTranslations[namespace];

        for (const lang in namespaceData) {
          const translationData = namespaceData[lang];

          i18n.addResourceBundle(lang, namespace, translationData, true, true);
        }
      }
    }
  }, [additionalTranslations, isSuccess]);
};
