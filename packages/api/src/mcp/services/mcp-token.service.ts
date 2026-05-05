/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { createHash, randomBytes } from 'crypto';

import type { McpToken, User } from '@hexabot-ai/types';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { FindManyOptions } from 'typeorm';

import { UserOrmEntity } from '@/user/entities/user.entity';
import { BaseOrmService } from '@/utils/generics/base-orm.service';

import { McpTokenCreateDto } from '../dto/mcp-token.dto';
import { McpTokenOrmEntity } from '../entities/mcp-token.entity';
import { McpTokenRepository } from '../repositories/mcp-token.repository';

export const MCP_PERSONAL_TOKEN_PREFIX = 'hbt_mcp_';

@Injectable()
export class McpTokenService extends BaseOrmService<McpTokenOrmEntity> {
  constructor(readonly repository: McpTokenRepository) {
    super(repository);
  }

  async createPersonalToken(
    ownerId: string,
    dto: McpTokenCreateDto,
  ): Promise<{ token: string; record: McpToken }> {
    const token = this.generateToken();
    const expiresAt = this.parseOptionalExpiry(dto.expiresAt);
    const record = await this.repository.create({
      name: dto.name,
      owner: ownerId,
      tokenHash: this.hashToken(token),
      tokenPrefix: this.getTokenPrefix(token),
      expiresAt,
      lastUsedAt: null,
      revokedAt: null,
    } as any);

    return { token, record };
  }

  async findOwnedTokens(ownerId: string): Promise<McpToken[]> {
    return await this.repository.find({
      where: { owner: { id: ownerId } },
      order: { createdAt: 'DESC' },
    } as FindManyOptions<McpTokenOrmEntity>);
  }

  async revokeOwnedToken(ownerId: string, id: string): Promise<McpToken> {
    const token = await this.repository.findOne({
      where: { id, owner: { id: ownerId } },
    } as any);

    if (!token) {
      throw new NotFoundException(`MCP token ${id} not found`);
    }

    return await this.repository.updateOne(
      {
        where: { id, owner: { id: ownerId } },
      } as any,
      { revokedAt: new Date() } as any,
    );
  }

  async authenticateBearerToken(
    token: string,
  ): Promise<{ user: User; tokenId: string }> {
    if (!token.startsWith(MCP_PERSONAL_TOKEN_PREFIX)) {
      throw new UnauthorizedException('Invalid MCP token');
    }

    const record = await this.repository.findOneByHash(this.hashToken(token));

    if (!record) {
      throw new UnauthorizedException('Invalid MCP token');
    }

    if (record.revokedAt) {
      throw new UnauthorizedException('MCP token has been revoked');
    }

    if (record.expiresAt && record.expiresAt <= new Date()) {
      throw new UnauthorizedException('MCP token has expired');
    }

    const owner = record.owner as UserOrmEntity | undefined;
    if (!owner?.state) {
      throw new UnauthorizedException('MCP token owner is inactive');
    }

    await this.repository.touchLastUsedAt(record.id);

    return {
      user: owner.toPlainCls() as User,
      tokenId: record.id,
    };
  }

  private generateToken(): string {
    return `${MCP_PERSONAL_TOKEN_PREFIX}${randomBytes(32).toString('base64url')}`;
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private getTokenPrefix(token: string): string {
    return token.slice(0, MCP_PERSONAL_TOKEN_PREFIX.length + 8);
  }

  private parseOptionalExpiry(value?: string | null): Date | null {
    if (!value) {
      return null;
    }

    const expiresAt = new Date(value);
    if (Number.isNaN(expiresAt.getTime())) {
      throw new BadRequestException('Invalid MCP token expiry date');
    }

    if (expiresAt <= new Date()) {
      throw new BadRequestException('MCP token expiry must be in the future');
    }

    return expiresAt;
  }
}
