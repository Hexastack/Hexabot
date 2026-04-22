/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type {
  Label as SharedLabel,
  LabelFull as SharedLabelFull,
  LabelStub as SharedLabelStub,
} from "@hexabot-ai/types";

export type ILabelStub = SharedLabelStub & {
  subscriber_count?: number;
};

export type Label = SharedLabel & {
  subscriber_count?: number;
};

export type LabelFull = SharedLabelFull & {
  subscriber_count?: number;
};
