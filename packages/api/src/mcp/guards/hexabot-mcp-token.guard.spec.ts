/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { UnauthorizedException } from '@nestjs/common';
import { ExecutionContext } from '@nestjs/common/interfaces';
import { ModuleRef } from '@nestjs/core';

import { McpTokenService } from '../services/mcp-token.service';
import { HexabotMcpRequest } from '../types';

import { HexabotMcpTokenGuard } from './hexabot-mcp-token.guard';

const buildContext = (request: HexabotMcpRequest): ExecutionContext =>
  ({
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  }) as unknown as ExecutionContext;

describe('HexabotMcpTokenGuard', () => {
  const activeUser = {
    id: 'user-id',
    email: 'agent@example.com',
    username: 'agent',
    roles: ['role-id'],
    state: true,
  };

  it('maps a valid bearer token to a Hexabot user', async () => {
    const mcpTokenService = {
      authenticateBearerToken: jest.fn().mockResolvedValue({
        user: activeUser,
        tokenId: 'token-id',
      }),
    } as unknown as McpTokenService;
    const moduleRef = {
      get: jest.fn().mockReturnValue(mcpTokenService),
    } as unknown as ModuleRef;
    const request = {
      headers: { authorization: 'Bearer hbt_mcp_secret' },
    } as HexabotMcpRequest;
    const guard = new HexabotMcpTokenGuard(moduleRef);

    await expect(guard.canActivate(buildContext(request))).resolves.toBe(true);

    expect(mcpTokenService.authenticateBearerToken).toHaveBeenCalledWith(
      'hbt_mcp_secret',
    );
    expect(request.hexabotUser).toEqual(activeUser);
    expect(request.user).toEqual(activeUser);
    expect(request.mcpTokenId).toBe('token-id');
  });

  it('rejects requests without bearer tokens', async () => {
    const moduleRef = {
      get: jest.fn(),
    } as unknown as ModuleRef;
    const request = { headers: {} } as HexabotMcpRequest;
    const guard = new HexabotMcpTokenGuard(moduleRef);

    await expect(
      guard.canActivate(buildContext(request)),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
