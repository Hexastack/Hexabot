/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

import { ContentFieldType } from "@/types/content-type.types";

export const FIELDS_FORM_NAME = "fields";
export const READ_ONLY_FIELDS = ["Title", "Status"] as const;
export const FIELDS_FORM_DEFAULT_VALUES = [
  {
    label: "Title",
    name: "title",
    type: ContentFieldType.TEXT,
  },
  {
    label: "Status",
    name: "status",
    type: ContentFieldType.CHECKBOX,
  },
];
