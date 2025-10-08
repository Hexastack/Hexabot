/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

import { useEffect, useRef } from "react";

import i18n from "@/i18n/config";

import { useApiClient } from "./useApiClient";
import { useAuth } from "./useAuth";

export const useRemoteI18n = () => {
  const { isAuthenticated } = useAuth();
  const { apiClient } = useApiClient();
  const isRemoteI18nLoaded = useRef(false);

  useEffect(() => {
    const fetchRemoteI18n = async () => {
      try {
        const additionalTranslations = await apiClient.fetchRemoteI18n();

        Object.keys(additionalTranslations).forEach((namespace) => {
          Object.keys(additionalTranslations[namespace]).forEach((lang) => {
            i18n.addResourceBundle(
              lang,
              namespace,
              additionalTranslations[namespace][lang],
              true,
              true,
            );
          });
        });
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Failed to fetch remote i18n translations:", error);
      }
    };

    if (isAuthenticated && !isRemoteI18nLoaded.current) {
      fetchRemoteI18n();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);
};
