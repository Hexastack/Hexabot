/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { mcpTokenFullSchema, mcpTokenSchema } from '@hexabot-ai/types';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  RelationId,
} from 'typeorm';

import { DatetimeColumn } from '@/database';
import { BaseOrmEntity } from '@/database/entities/base.entity';
import { UserOrmEntity } from '@/user/entities/user.entity';
import { AsRelation } from '@/utils/decorators/relation-ref.decorator';

import { McpTokenDto } from '../dto/mcp-token.dto';

@Entity({ name: 'mcp_tokens' })
@Index(['tokenHash'], { unique: true })
@Index(['owner'])
export class McpTokenOrmEntity extends BaseOrmEntity<McpTokenDto> {
  plainCls = mcpTokenSchema;

  fullCls = mcpTokenFullSchema;

  @Column()
  name!: string;

  @Column({ name: 'token_hash', type: 'text' })
  tokenHash!: string;

  @Column({ name: 'token_prefix', length: 32 })
  tokenPrefix!: string;

  @ManyToOne(() => UserOrmEntity, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'owner_id' })
  @AsRelation()
  owner!: UserOrmEntity;

  @RelationId((token: McpTokenOrmEntity) => token.owner)
  private readonly ownerId!: string;

  @DatetimeColumn({ name: 'expires_at', nullable: true })
  expiresAt!: Date | null;

  @DatetimeColumn({ name: 'last_used_at', nullable: true })
  lastUsedAt!: Date | null;

  @DatetimeColumn({ name: 'revoked_at', nullable: true })
  revokedAt!: Date | null;
}
