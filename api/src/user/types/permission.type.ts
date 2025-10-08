/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

import { Action } from './action.type';
import { TModel } from './model.type';

type ModelPermissionsPerRole = Record<TModel, Action[]>;

export type PermissionsTree = Record<string, ModelPermissionsPerRole>;
