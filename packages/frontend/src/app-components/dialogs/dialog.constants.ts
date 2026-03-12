/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type { ComponentType } from "react";

import { ContentTypeFormDialog } from "@/components/content-types/ContentTypeFormDialog";
import { ContentFormDialog } from "@/components/contents/ContentFormDialog";
import { CredentialFormDialog } from "@/components/credentials/CredentialFormDialog";
import { LabelFormDialog } from "@/components/labels/LabelFormDialog";
import { LanguageFormDialog } from "@/components/languages/LanguageFormDialog";
import { MemoryDefinitionFormDialog } from "@/components/memory-definitions/MemoryDefinitionFormDialog";
import { MenuFormDialog } from "@/components/menu/MenuFormDialog";
import { RoleFormDialog } from "@/components/roles/RoleFormDialog";
import { SubscriberFormDialog } from "@/components/subscribers/SubscriberFormDialog";
import { TranslationFormDialog } from "@/components/translations/TranslationFormDialog";
import { WorkflowFormDialog } from "@/components/visual-editor/v4/components/forms/WorkflowFormDialog";
import { EntityType } from "@/services/types";

type PayloadFromDialog<TDialog> =
  TDialog extends ComponentType<infer TProps>
    ? TProps extends { payload: infer TPayload }
      ? TPayload
      : never
    : never;

type PresetValuesFromDialog<TDialog> =
  PayloadFromDialog<TDialog> extends { presetValues?: infer TPresetValues }
    ? TPresetValues
    : never;

const withPresetValues = <TDialog extends ComponentType<any>>(
  dialog: TDialog,
) => ({
  dialog,
  presetValues: undefined as PresetValuesFromDialog<TDialog> | undefined,
});

export const BASE_ADD_DIALOG_MAP = {
  [EntityType.CONTENT_TYPE]: withPresetValues(ContentTypeFormDialog),
  [EntityType.CONTENT]: withPresetValues(ContentFormDialog),
  [EntityType.CREDENTIAL]: withPresetValues(CredentialFormDialog),
  [EntityType.LANGUAGE]: withPresetValues(LanguageFormDialog),
  [EntityType.LABEL]: withPresetValues(LabelFormDialog),
  [EntityType.MEMORY_DEFINITION]: withPresetValues(MemoryDefinitionFormDialog),
  [EntityType.MENU]: withPresetValues(MenuFormDialog),
  [EntityType.ROLE]: withPresetValues(RoleFormDialog),
  [EntityType.SUBSCRIBER]: withPresetValues(SubscriberFormDialog),
  [EntityType.TRANSLATION]: withPresetValues(TranslationFormDialog),
  [EntityType.WORKFLOW]: withPresetValues(WorkflowFormDialog),
} as const;
