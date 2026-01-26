/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { ActionBaseInputTemplate } from "./ActionBaseInputTemplate";
import { ActionFieldTemplate } from "./ActionFieldTemplate";
import { EmptyDescriptionFieldTemplate } from "./EmptyDescriptionFieldTemplate";
import { NestedTitleField } from "./NestedTitleField";

export const FORM_TEMPLATES = {
    TitleFieldTemplate: NestedTitleField,
    FieldTemplate: ActionFieldTemplate,
    DescriptionFieldTemplate: EmptyDescriptionFieldTemplate,
    BaseInputTemplate: ActionBaseInputTemplate,
}