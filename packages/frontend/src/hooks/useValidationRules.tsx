/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { useTranslate } from "@/hooks/useTranslate";

export const useValidationRules = () => {
  const { t } = useTranslate();
  const validationRules = {
    first_name: {},
    last_name: {},
    email: {
      pattern: {
        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
        message: t("message.email_is_invalid"),
      },
    },
    language: {},
    password: {
      minLength: {
        value: 8,
        message: t("message.password_min_length"),
      },
    },
    password2: {
      minLength: {
        value: 8,
        message: t("message.password_min_length"),
      },
      validate: (value: string, values: any) => {
        return value === values.password || t("message.password_match");
      },
    },
    url: {
      pattern: {
        value: /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i,
        message: t("message.url_is_invalid"),
      },
    },
  };

  return validationRules;
};
