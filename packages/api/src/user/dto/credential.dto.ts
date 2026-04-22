/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  credentialFullSchema,
  credentialSchema,
  credentialStubSchema,
  type Credential,
  type CredentialFull,
  type CredentialStub,
} from '@hexabot-ai/types';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

import { IsUUIDv4 } from '@/utils/decorators/is-uuid.decorator';
import { TDto } from '@/utils/types/dto.types';

export { credentialFullSchema, credentialSchema, credentialStubSchema };

export type { Credential, CredentialFull, CredentialStub };

export class CredentialCreateDto {
  @ApiProperty({
    description: 'Credential unique name',
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiProperty({
    description: 'Credential value',
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  value!: string;

  @ApiPropertyOptional({
    description: 'Credential owner',
    type: String,
  })
  @IsString()
  @IsOptional()
  @IsUUIDv4({ message: 'owner must be a valid UUID' })
  owner!: string;
}

export class CredentialUpdateDto extends PartialType(CredentialCreateDto) {}

export type CredentialDto = TDto<
  {
    plain: typeof credentialSchema;
    full: typeof credentialFullSchema;
  },
  {
    create: CredentialCreateDto;
    update: CredentialUpdateDto;
  }
>;
