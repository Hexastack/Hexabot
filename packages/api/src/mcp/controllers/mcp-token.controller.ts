/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';

import { UuidParam } from '@/utils';

import { McpTokenCreateDto } from '../dto/mcp-token.dto';
import { McpTokenService } from '../services/mcp-token.service';

type AuthenticatedRequest = Request & {
  user?: { id?: string };
  session?: Request['session'] & {
    passport?: { user?: { id?: string } };
  };
};

@Controller('mcp-token')
export class McpTokenController {
  constructor(private readonly mcpTokenService: McpTokenService) {}

  @Get()
  async list(@Req() req: AuthenticatedRequest) {
    return await this.mcpTokenService.findOwnedTokens(this.getUserId(req));
  }

  @Post()
  async create(
    @Body() dto: McpTokenCreateDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return await this.mcpTokenService.createPersonalToken(
      this.getUserId(req),
      dto,
    );
  }

  @Post(':id/revoke')
  @HttpCode(200)
  async revoke(@UuidParam('id') id: string, @Req() req: AuthenticatedRequest) {
    return await this.mcpTokenService.revokeOwnedToken(this.getUserId(req), id);
  }

  private getUserId(req: AuthenticatedRequest): string {
    const userId = req.user?.id ?? req.session?.passport?.user?.id;
    if (!userId) {
      throw new UnauthorizedException('Authenticated user is required');
    }

    return userId;
  }
}
