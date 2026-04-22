/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  mcpServerFullSchema,
  mcpServerSchema,
  mcpServerStubSchema,
  type McpServer,
  type McpServerFull,
  type McpServerStub,
} from '@hexabot-ai/types';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  ValidateIf,
} from 'class-validator';

import { IsUUIDv4 } from '@/utils/decorators/is-uuid.decorator';
import { TDto } from '@/utils/types/dto.types';

import { McpServerTransport } from '../types';

export { mcpServerFullSchema, mcpServerSchema, mcpServerStubSchema };

export type { McpServer, McpServerFull, McpServerStub };

export class McpServerCreateDto {
  @ApiProperty({
    description: 'MCP server display name',
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiPropertyOptional({
    description: 'Whether this MCP server can be used at runtime',
    type: Boolean,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({
    description: 'Transport type used to connect to the MCP server',
    enum: McpServerTransport,
    enumName: 'McpServerTransport',
    default: McpServerTransport.http,
  })
  @IsOptional()
  @IsEnum(McpServerTransport)
  transport?: McpServerTransport;

  @ApiPropertyOptional({
    description: 'MCP server URL (required for HTTP transport)',
    type: String,
    example: 'https://mcp.example.com/mcp',
  })
  @ValidateIf(
    (payload: McpServerCreateDto) =>
      (payload.transport ?? McpServerTransport.http) ===
      McpServerTransport.http,
  )
  @IsNotEmpty()
  @IsString()
  @IsUrl({
    require_tld: false,
  })
  url!: string | null;

  @ApiPropertyOptional({
    description: 'Command executed for stdio transport (required for stdio)',
    type: String,
    example: 'npx',
  })
  @ValidateIf(
    (payload: McpServerCreateDto) =>
      (payload.transport ?? McpServerTransport.http) ===
      McpServerTransport.stdio,
  )
  @IsNotEmpty()
  @IsString()
  command!: string | null;

  @ApiPropertyOptional({
    description: 'Arguments passed to stdio command',
    type: [String],
    example: ['-y', '@modelcontextprotocol/server-filesystem'],
  })
  @ValidateIf(
    (payload: McpServerCreateDto) =>
      (payload.transport ?? McpServerTransport.http) ===
      McpServerTransport.stdio,
  )
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  args?: string[] | null;

  @ApiPropertyOptional({
    description: 'Working directory used by stdio command',
    type: String,
    example: '/opt/mcp',
  })
  @ValidateIf(
    (payload: McpServerCreateDto) =>
      (payload.transport ?? McpServerTransport.http) ===
      McpServerTransport.stdio,
  )
  @IsOptional()
  @IsString()
  cwd?: string | null;

  @ApiPropertyOptional({
    description: 'Credential identifier used to build Authorization headers',
    type: String,
  })
  @IsOptional()
  @IsString()
  @IsUUIDv4({ message: 'credential must be a valid UUID' })
  credential?: string | null;
}

export class McpServerUpdateDto extends PartialType(McpServerCreateDto) {}

export type McpServerDto = TDto<
  {
    plain: typeof mcpServerSchema;
    full: typeof mcpServerFullSchema;
  },
  {
    create: McpServerCreateDto;
    update: McpServerUpdateDto;
  }
>;
