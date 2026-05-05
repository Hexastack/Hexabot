/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { UnauthorizedException } from '@nestjs/common';

import { McpTokenRepository } from '../repositories/mcp-token.repository';

import {
  MCP_PERSONAL_TOKEN_PREFIX,
  McpTokenService,
} from './mcp-token.service';

describe('McpTokenService', () => {
  const user = {
    id: 'user-id',
    username: 'agent',
    email: 'agent@example.com',
    roles: ['role-id'],
    state: true,
  };
  const buildService = (overrides: Partial<McpTokenRepository> = {}) => {
    const repository = {
      create: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      findOneByHash: jest.fn(),
      touchLastUsedAt: jest.fn(),
      updateOne: jest.fn(),
      ...overrides,
    } as unknown as jest.Mocked<McpTokenRepository>;

    return {
      repository,
      service: new McpTokenService(repository),
    };
  };

  it('creates a personal token and stores only a hash', async () => {
    const { repository, service } = buildService({
      create: jest.fn().mockImplementation((payload) => ({
        id: 'token-id',
        name: payload.name,
        tokenPrefix: payload.tokenPrefix,
        owner: payload.owner,
        expiresAt: payload.expiresAt,
        lastUsedAt: null,
        revokedAt: null,
      })),
    });
    const result = await service.createPersonalToken('user-id', {
      name: 'Codex',
    });

    expect(result.token).toMatch(new RegExp(`^${MCP_PERSONAL_TOKEN_PREFIX}`));
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Codex',
        owner: 'user-id',
        tokenHash: expect.any(String),
        tokenPrefix: expect.stringMatching(/^hbt_mcp_/),
      }),
    );
    expect(repository.create).not.toHaveBeenCalledWith(
      expect.objectContaining({ token: result.token }),
    );
    expect(JSON.stringify(result.record)).not.toContain('tokenHash');
  });

  it('authenticates an active token owner', async () => {
    const owner = {
      state: true,
      toPlainCls: jest.fn().mockReturnValue(user),
    };
    const { repository, service } = buildService({
      findOneByHash: jest.fn().mockResolvedValue({
        id: 'token-id',
        owner,
        expiresAt: null,
        revokedAt: null,
      } as any),
      touchLastUsedAt: jest.fn().mockResolvedValue(undefined),
    });

    await expect(
      service.authenticateBearerToken(`${MCP_PERSONAL_TOKEN_PREFIX}secret`),
    ).resolves.toEqual({ user, tokenId: 'token-id' });

    expect(repository.touchLastUsedAt).toHaveBeenCalledWith('token-id');
  });

  it('rejects revoked, expired, unknown, or inactive tokens', async () => {
    const { service, repository } = buildService();

    await expect(
      service.authenticateBearerToken('not-a-hexabot-token'),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    repository.findOneByHash.mockResolvedValueOnce(null);
    await expect(
      service.authenticateBearerToken(`${MCP_PERSONAL_TOKEN_PREFIX}unknown`),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    repository.findOneByHash.mockResolvedValueOnce({
      revokedAt: new Date(),
    } as any);
    await expect(
      service.authenticateBearerToken(`${MCP_PERSONAL_TOKEN_PREFIX}revoked`),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    repository.findOneByHash.mockResolvedValueOnce({
      revokedAt: null,
      expiresAt: new Date(Date.now() - 1000),
    } as any);
    await expect(
      service.authenticateBearerToken(`${MCP_PERSONAL_TOKEN_PREFIX}expired`),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    repository.findOneByHash.mockResolvedValueOnce({
      revokedAt: null,
      expiresAt: null,
      owner: { state: false },
    } as any);
    await expect(
      service.authenticateBearerToken(`${MCP_PERSONAL_TOKEN_PREFIX}inactive`),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
