/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { StorageModeEnum } from './storage-mode.enum';

export interface NlpModel {
  foreign_id?: string; // Optional external identifier
  name: string; // Unique name of the model
  version: number; // Version of the model
  uri: string; // URI or location of the model
  storage_mode: StorageModeEnum;
  metadata?: Record<string, any>; // Additional metadata for the model
  isActive: boolean; // Indicates if the model is active
  experiments?: string[]; // Associated experiments (list of IDs or names)
}

export const CACHEABLE_NLP_MODELS: NlpModel[] = []; // Example: Predefined cached models
