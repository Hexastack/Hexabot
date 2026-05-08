/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Action } from '@hexabot-ai/types';
import { Injectable, NotFoundException } from '@nestjs/common';
import { Tool, ToolGuards } from '@rekog/mcp-nest';
import { z } from 'zod';

import { CredentialService } from '@/user/services/credential.service';

import { McpPermission } from '../decorators/mcp-permission.decorator';
import { McpPermissionGuard } from '../guards/mcp-permission.guard';

import { HexabotMcpToolBase } from './hexabot-mcp-tool.base';
import {
  PaginationArgs,
  paginationSchema,
  uuidSchema,
} from './hexabot-mcp.schemas';
import { sanitizeCredential } from './hexabot-mcp.utils';

@Injectable()
export class HexabotCredentialMcpTools extends HexabotMcpToolBase {
  constructor(private readonly credentialService: CredentialService) {
    super();
  }

  @McpPermission('credential', Action.READ)
  @ToolGuards([McpPermissionGuard])
  @Tool({
    name: 'hexabot_credential_search',
    description:
      'Search credentials by metadata only. Secret credential values are never returned.',
    parameters: z.object({
      query: z.string().optional(),
      ownerId: uuidSchema.optional(),
      ...paginationSchema,
    }),
  })
  async searchCredentials(
    args: { query?: string; ownerId?: string } & PaginationArgs,
  ) {
    const where = {
      ...(args.ownerId ? { owner: { id: args.ownerId } } : {}),
      ...(args.query ? { name: this.contains(args.query) } : {}),
    } as any;
    const result = await this.listWithCount(
      this.credentialService,
      this.findOptions(args, where),
    );

    return {
      ...result,
      items: result.items.map((credential) =>
        sanitizeCredential(credential as Record<string, unknown>),
      ),
    };
  }

  @McpPermission('credential', Action.READ)
  @ToolGuards([McpPermissionGuard])
  @Tool({
    name: 'hexabot_credential_get',
    description:
      'Read credential metadata. Secret credential values are never returned.',
    parameters: z.object({
      id: uuidSchema,
    }),
  })
  async getCredential(args: { id: string }) {
    const credential = await this.credentialService.findOneAndPopulate(args.id);
    if (!credential) {
      throw new NotFoundException(`Credential ${args.id} not found`);
    }

    return sanitizeCredential(credential as Record<string, unknown>);
  }
}
