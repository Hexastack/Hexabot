/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { mcpServerSchema, mcpServerFullSchema } from '@hexabot-ai/types';
import { BadRequestException } from '@nestjs/common';
import {
  AfterLoad,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  RelationId,
} from 'typeorm';

import { AuditLabel } from '@/audit/decorators/audit-label.decorator';
import { EnumColumn } from '@/database/decorators/enum-column.decorator';
import { JsonColumn } from '@/database/decorators/json-column.decorator';
import {
  OnBeforeInsert,
  OnBeforeUpdate,
} from '@/database/decorators/orm-event-hooks.decorator';
import { BaseOrmEntity } from '@/database/entities/base.entity';
import { CredentialOrmEntity } from '@/user/entities/credential.entity';
import { AsRelation } from '@/utils/decorators/relation-ref.decorator';

import { McpServerDto } from '../dto/mcp-server.dto';
import { McpServerTransport } from '../types';

@Entity({ name: 'mcp_servers' })
@Index(['name'], { unique: true })
export class McpServerOrmEntity extends BaseOrmEntity<McpServerDto> {
  plainCls = mcpServerSchema;

  fullCls = mcpServerFullSchema;

  private originalTransport?: McpServerTransport;

  private originalCredentialId?: string | null;

  /** Human-friendly name used in workflow tool bindings. */
  @AuditLabel()
  @Column({ type: 'varchar', length: 255 })
  name!: string;

  /** Whether runtime clients can use this server. */
  @Column({ default: true })
  enabled!: boolean;

  /** Supported MCP transport. */
  @EnumColumn({ enum: McpServerTransport, default: McpServerTransport.http })
  transport!: McpServerTransport;

  /** MCP endpoint URL (required for HTTP transport). */
  @Column({ type: 'text', nullable: true })
  url!: string | null;

  /** Executable command (required for stdio transport). */
  @Column({ type: 'text', nullable: true })
  command!: string | null;

  /** Command arguments for stdio transport. */
  @JsonColumn({ nullable: true })
  args!: string[] | null;

  /** Working directory for stdio transport command. */
  @Column({ type: 'text', nullable: true })
  cwd!: string | null;

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

  @AfterLoad()
  protected rememberPersistedState(): void {
    this.originalTransport = this.transport;
    this.originalCredentialId = this.resolveCredentialId();
  }

  @OnBeforeInsert()
  @OnBeforeUpdate()
  protected normalizeTransportConfiguration(): void {
    this.url = this.normalizeNullableString(this.url);
    this.command = this.normalizeNullableString(this.command);
    this.cwd = this.normalizeNullableString(this.cwd);
    this.args = this.normalizeArgs(this.args);

    if (this.transport === McpServerTransport.http) {
      if (!this.url) {
        throw new BadRequestException(
          'url is required when transport is "http"',
        );
      }

      this.command = null;
      this.args = null;
      this.cwd = null;

      return;
    }

    if (this.transport === McpServerTransport.stdio) {
      if (!this.command) {
        throw new BadRequestException(
          'command is required when transport is "stdio"',
        );
      }

      if (this.shouldRejectStdioCredential()) {
        throw new BadRequestException(
          'credential is not supported when transport is "stdio"',
        );
      }

      this.url = null;
      this.credential = null;

      return;
    }

    throw new BadRequestException(
      `Unsupported MCP transport "${this.transport}"`,
    );
  }

  private shouldRejectStdioCredential(): boolean {
    const currentCredentialId = this.resolveCredentialId();
    if (!currentCredentialId) {
      return false;
    }

    if (this.originalTransport === McpServerTransport.http) {
      return (this.originalCredentialId ?? null) !== currentCredentialId;
    }

    return true;
  }

  private resolveCredentialId(): string | null {
    if (typeof this.credential === 'string') {
      return this.normalizeNullableString(this.credential);
    }

    if (
      this.credential &&
      typeof this.credential === 'object' &&
      'id' in this.credential
    ) {
      const id = (this.credential as { id?: string }).id;

      return this.normalizeNullableString(id);
    }

    return this.normalizeNullableString(this.credentialId ?? null);
  }

  private normalizeNullableString(
    value: string | null | undefined,
  ): string | null {
    if (typeof value !== 'string') {
      return null;
    }

    const normalized = value.trim();

    return normalized ? normalized : null;
  }

  private normalizeArgs(value: string[] | null | undefined): string[] | null {
    if (!Array.isArray(value)) {
      return null;
    }

    return value.map((arg) => arg.trim());
  }
}
