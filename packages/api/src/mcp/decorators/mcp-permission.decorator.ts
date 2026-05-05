/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { SetMetadata } from '@nestjs/common';

import { Action } from '@/user/types/action.type';
import { TModel } from '@/user/types/model.type';

export const MCP_PERMISSION_METADATA_KEY = 'mcp:hexabot-permission';

export type McpPermissionMetadata = {
  model: TModel;
  action: Action;
};

export const McpPermission = (model: TModel, action: Action): MethodDecorator =>
  SetMetadata(MCP_PERMISSION_METADATA_KEY, {
    model,
    action,
  } satisfies McpPermissionMetadata);
