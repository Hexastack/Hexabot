/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  RelationId,
} from 'typeorm';

import { EnumColumn } from '@/database/decorators/enum-column.decorator';
import { BaseOrmEntity } from '@/database/entities/base.entity';
import { CredentialOrmEntity } from '@/user';
import { AsRelation } from '@/utils';

import {
  McpServer,
  McpServerFull,
  McpServerTransformerDto,
} from '../dto/mcp-server.dto';
import { McpServerTransport } from '../types';

@Entity({ name: 'mcp_servers' })
@Index(['name'], { unique: true })
export class McpServerOrmEntity extends BaseOrmEntity<McpServerTransformerDto> {
  plainCls = McpServer;

  fullCls = McpServerFull;

  /** Human-friendly name used in workflow tool bindings. */
  @Column({ type: 'varchar', length: 255 })
  name!: string;

  /** Whether runtime clients can use this server. */
  @Column({ default: true })
  enabled!: boolean;

  /** Supported MCP transport (HTTP in v1). */
  @EnumColumn({ enum: McpServerTransport, default: McpServerTransport.http })
  transport!: McpServerTransport;

  /** MCP endpoint URL (streamable HTTP). */
  @Column({ type: 'text' })
  url!: string;

  /** Optional credential used to derive Authorization headers. */
  @ManyToOne(() => CredentialOrmEntity, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'credential_id' })
  @AsRelation()
  credential?: CredentialOrmEntity | null;

  /** Identifier of the linked credential. */
  @RelationId((server: McpServerOrmEntity) => server.credential)
  private readonly credentialId?: string | null;
}
