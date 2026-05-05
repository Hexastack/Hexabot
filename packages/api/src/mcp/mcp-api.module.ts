/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { randomUUID } from 'crypto';

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { McpModule, McpTransportType } from '@rekog/mcp-nest';

import { ActionsModule } from '@/actions/actions.module';
import { BindingsModule } from '@/bindings/bindings.module';
import { CmsModule } from '@/cms/cms.module';
import { config } from '@/config';
import { UserModule } from '@/user/user.module';
import { WorkflowModule } from '@/workflow/workflow.module';

import { McpTokenController } from './controllers/mcp-token.controller';
import { McpTokenOrmEntity } from './entities/mcp-token.entity';
import { HexabotMcpTokenGuard } from './guards/hexabot-mcp-token.guard';
import { McpPermissionGuard } from './guards/mcp-permission.guard';
import { McpTokenRepository } from './repositories/mcp-token.repository';
import { McpTokenService } from './services/mcp-token.service';
import { HexabotMcpTools } from './tools/hexabot-mcp.tools';

@Module({
  imports: [
    TypeOrmModule.forFeature([McpTokenOrmEntity]),
    McpModule.forRoot({
      name: config.mcp.serverName,
      title: config.mcp.serverTitle,
      version: config.mcp.serverVersion,
      description: config.mcp.serverDescription,
      instructions: config.mcp.serverInstructions,
      transport: McpTransportType.STREAMABLE_HTTP,
      mcpEndpoint: 'mcp',
      guards: [HexabotMcpTokenGuard],
      streamableHttp: {
        enableJsonResponse: false,
        sessionIdGenerator: () => randomUUID(),
        statelessMode: false,
      },
    }),
    ActionsModule,
    BindingsModule,
    CmsModule,
    UserModule,
    WorkflowModule,
  ],
  providers: [
    HexabotMcpTokenGuard,
    McpPermissionGuard,
    McpTokenRepository,
    McpTokenService,
    HexabotMcpTools,
  ],
  controllers: [McpTokenController],
})
export class McpApiModule {}
