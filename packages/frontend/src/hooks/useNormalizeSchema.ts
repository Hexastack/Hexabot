/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { SchemaNodeForm } from "@/app-components/inputs/JsonSchemaObjectBuilder";
import { ContentSchemaProperties } from "@/types/content-type.types";
import { isAbsoluteUrl } from "@/utils/URL";

import { useTranslate } from "./useTranslate";

export const useNormalizeSchema = () => {
  const { t } = useTranslate();
  const baseTypeRules = {
    uri: {
      required: t("message.url_is_invalid"),
      validate: (value: string) =>
        isAbsoluteUrl(value) || t("message.url_is_invalid"),
    },
  };
  const getNormalizedSchema = (schema?: SchemaNodeForm) => {
    const properties = schema?.["properties"] as
      | ContentSchemaProperties
      | undefined;
    const required = (schema?.["required"] || []) as string[];
    const schemaRules = required.reduce(
      (acc, cur) => ({
        ...acc,
        [cur]: {
          required: true,
          ...baseTypeRules[properties?.[cur].type || ""],
        },
      }),
      {},
    );

    return { properties, required, schemaRules };
  };

  return { getNormalizedSchema };
};
