/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { auditLogFullSchema, auditLogSchema } from '@hexabot-ai/types';
import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

import { TDto } from '@/utils/types/dto.types';

export class AuditLogCreateDto {
  @ApiProperty({ description: 'Audited resource identifier', type: String })
  @IsString()
  @IsNotEmpty()
  resourceId: string;

  @ApiProperty({ description: 'Audited resource type', type: String })
  @IsString()
  @IsNotEmpty()
  resourceType: string;

  @ApiProperty({ description: 'Audited operation identifier', type: String })
  @IsString()
  @IsNotEmpty()
  operationId: string;

  @ApiProperty({ description: 'Audited operation type', type: String })
  @IsString()
  @IsNotEmpty()
  operationType: string;

  @ApiProperty({
    description: 'Audited operation status',
    enum: ['UNSPECIFIED', 'SUCCEEDED', 'FAILED'],
  })
  @IsIn(['UNSPECIFIED', 'SUCCEEDED', 'FAILED'])
  operationStatus: 'UNSPECIFIED' | 'SUCCEEDED' | 'FAILED';

  @ApiProperty({ description: 'Actor identifier', type: String })
  @IsString()
  @IsNotEmpty()
  actorId: string;

  @ApiProperty({ description: 'Actor type', type: String })
  @IsString()
  @IsNotEmpty()
  actorType: string;

  @ApiPropertyOptional({ description: 'Actor IP address', type: String })
  @IsString()
  @IsOptional()
  actorIp?: string | null;

  @ApiPropertyOptional({ description: 'Actor user agent', type: String })
  @IsString()
  @IsOptional()
  actorAgent?: string | null;

  @ApiPropertyOptional({ description: 'Request/correlation ID', type: String })
  @IsString()
  @IsOptional()
  requestId?: string | null;

  @ApiPropertyOptional({ description: 'HTTP method', type: String })
  @IsString()
  @IsOptional()
  requestMethod?: string | null;

  @ApiPropertyOptional({ description: 'HTTP path', type: String })
  @IsString()
  @IsOptional()
  requestPath?: string | null;

  @ApiPropertyOptional({ description: 'Data before the operation' })
  @IsObject()
  @IsOptional()
  dataBefore?: unknown;

  @ApiPropertyOptional({ description: 'Data after the operation' })
  @IsObject()
  @IsOptional()
  dataAfter?: unknown;

  @ApiPropertyOptional({ description: 'Computed data diff' })
  @IsObject()
  @IsOptional()
  dataDiff?: unknown;

  @ApiPropertyOptional({ description: 'Raw SDK audit payload' })
  @IsObject()
  @IsOptional()
  raw?: unknown;
}

export class AuditLogUpdateDto extends PartialType(AuditLogCreateDto) {}

export type AuditLogDto = TDto<
  {
    plain: typeof auditLogSchema;
    full: typeof auditLogFullSchema;
  },
  {
    create: AuditLogCreateDto;
    update: AuditLogUpdateDto;
  }
>;
