/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { ActionCheckboxesWidget } from "./ActionCheckboxesWidget";
import { ActionCheckboxWidget } from "./ActionCheckboxWidget";
import { ActionRadioWidget } from "./ActionRadioWidget";
import { ActionRangeWidget } from "./ActionRangeWidget";
import { ActionSelectWidget } from "./ActionSelectWidget";
import { AutoCompleteWidget } from "./AutoCompleteWidget";
import { JsonataTextWidget } from "./JsonataTextWidget";

export const FORM_WIDGETS = {
  TextWidget: JsonataTextWidget,
  TextareaWidget: JsonataTextWidget,
  SelectWidget: ActionSelectWidget,
  CheckboxWidget: ActionCheckboxWidget,
  CheckboxesWidget: ActionCheckboxesWidget,
  RadioWidget: ActionRadioWidget,
  RangeWidget: ActionRangeWidget,
  AutoCompleteWidget,
} as const;
