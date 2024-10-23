/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
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
