/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type {
  LabelGroup as SharedLabelGroup,
  LabelGroupStub as SharedLabelGroupStub,
} from "@hexabot-ai/types";

export type ILabelGroupStub = SharedLabelGroupStub;

export type ILabelGroupAttributes = Pick<SharedLabelGroup, "name">;

export type LabelGroup = SharedLabelGroup;
