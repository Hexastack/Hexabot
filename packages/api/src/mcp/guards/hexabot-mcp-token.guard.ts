/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { Request } from 'express';

import { McpTokenService } from '../services/mcp-token.service';
import { HexabotMcpRequest } from '../types';

@Injectable()
export class HexabotMcpTokenGuard implements CanActivate {
  constructor(private readonly moduleRef: ModuleRef) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<HexabotMcpRequest>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('MCP bearer token is required');
    }

    const { user, tokenId } =
      await this.getMcpTokenService().authenticateBearerToken(token);

    request.hexabotUser = user;
    request.user = user;
    request.mcpTokenId = tokenId;

    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      return undefined;
    }

    const match = authHeader.trim().match(/^Bearer\s+(\S+)$/i);

    return match?.[1];
  }

  private getMcpTokenService(): McpTokenService {
    return this.moduleRef.get(McpTokenService, { strict: false });
  }
}
