/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 * 3. SaaS Restriction: This software, or any derivative of it, may not be used to offer a competing product or service (SaaS) without prior written consent from Hexastack. Offering the software as a service or using it in a commercial cloud environment without express permission is strictly prohibited.
 */

import { Label } from '@/chat/schemas/label.schema';

import { modelInstance } from './base.mock';

const baseLabel: Label = {
  ...modelInstance,
  title: '',
  name: '',
  label_id: {
    messenger: '',
    offline: '',
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
    offline: 'none',
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
      offline: 'none',
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
      offline: 'none',
      dimelo: 'none',
      twitter: 'none',
    },
  },
];
