/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { BaseOrmRepository } from '@/utils/generics/base-orm.repository';

import { McpServerDtoConfig } from '../dto/mcp-server.dto';
import { McpServerOrmEntity } from '../entities/mcp-server.entity';

@Injectable()
export class McpServerRepository extends BaseOrmRepository<
  McpServerOrmEntity,
  McpServerDtoConfig
> {
  constructor(
    @InjectRepository(McpServerOrmEntity)
    repository: Repository<McpServerOrmEntity>,
  ) {
    super(repository, ['credential']);
  }
}
