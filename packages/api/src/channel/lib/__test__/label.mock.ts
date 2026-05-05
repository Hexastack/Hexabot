/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Label } from '@hexabot-ai/types';

import { modelInstance } from './base.mock';

const baseLabel: Label = {
  ...modelInstance,
  title: '',
  name: '',
  description: '',
  builtin: false,
  group: null,
};

export const labelMock: Label = {
  ...baseLabel,
  title: 'Label',
  name: 'label',
};

export const customerLabelsMock: Label[] = [
  {
    ...baseLabel,
    title: 'Client',
    name: 'client',
  },
  {
    ...baseLabel,
    title: 'Professional',
    name: 'profressional',
  },
];
