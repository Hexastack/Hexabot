/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Label } from '@/chat/schemas/label.schema';

import { modelInstance } from './base.mock';

const baseLabel: Label = {
  ...modelInstance,
  title: '',
  name: '',
  label_id: {
    messenger: '',
    web: '',
    dimelo: '',
    twitter: '',
  },
  description: '',
  builtin: false,
  group: null,
};

export const labelMock: Label = {
  ...baseLabel,
  title: 'Label',
  name: 'label',
  label_id: {
    messenger: 'none',
    web: 'none',
    dimelo: 'none',
    twitter: 'none',
  },
};

export const customerLabelsMock: Label[] = [
  {
    ...baseLabel,
    title: 'Client',
    name: 'client',
    label_id: {
      messenger: 'none',
      web: 'none',
      dimelo: 'none',
      twitter: 'none',
    },
  },
  {
    ...baseLabel,
    title: 'Professional',
    name: 'profressional',
    label_id: {
      messenger: 'none',
      web: 'none',
      dimelo: 'none',
      twitter: 'none',
    },
  },
];
