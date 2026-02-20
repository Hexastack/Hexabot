/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { ActionAttachmentField } from "./ActionAttachmentField";
import { AutoCompleteField } from "./AutoCompleteField";
import { JsonSchemaObjectField } from "./JsonSchemaObjectField";

export const FORM_FIELDS = {
  ActionAttachmentField,
  AutoCompleteField,
  JsonSchemaObjectField,
} as const;
