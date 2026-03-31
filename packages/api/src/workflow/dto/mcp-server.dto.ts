/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Exclude, Expose, Transform, Type } from 'class-transformer';
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

import { Credential } from '@/user';
import { IsUUIDv4 } from '@/utils/decorators/is-uuid.decorator';
import {
  BaseStub,
  BuildDto,
  DtoActionConfig,
  DtoTransformerConfig,
} from '@/utils/types/dto.types';

import { McpServerTransport } from '../types';

@Exclude()
export class McpServerStub extends BaseStub {
  @Expose()
  name!: string;

  @Expose()
  enabled!: boolean;

  @Expose()
  transport!: McpServerTransport;

  @Expose()
  url!: string | null;

  @Expose()
  command!: string | null;

  @Expose()
  args!: string[] | null;

  @Expose()
  cwd!: string | null;
}

@Exclude()
export class McpServer extends McpServerStub {
  @Expose({ name: 'credentialId' })
  @Transform(({ value }) => value ?? null)
  credential!: string | null;
}

@Exclude()
export class McpServerFull extends McpServerStub {
  @Expose()
  @Type(() => Credential)
  credential?: Credential | null;
}

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

export type McpServerTransformerDto = DtoTransformerConfig<{
  PlainCls: typeof McpServer;
  FullCls: typeof McpServerFull;
}>;

export type McpServerDtoConfig = DtoActionConfig<{
  create: McpServerCreateDto;
  update: McpServerUpdateDto;
}>;

export type McpServerDto = BuildDto<
  McpServerDtoConfig,
  McpServerTransformerDto
>;
