/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

import { IsUUIDv4 } from '@/utils/decorators/is-uuid.decorator';
import {
  BaseStub,
  DtoActionConfig,
  DtoTransformerConfig,
} from '@/utils/types/dto.types';

import { User } from './user.dto';

@Exclude()
export class CredentialStub extends BaseStub {
  @Expose()
  name!: string;

  @Expose()
  value!: string;
}

@Exclude()
export class Credential extends CredentialStub {
  @Expose({ name: 'ownerId' })
  owner!: string;
}

@Exclude()
export class CredentialFull extends CredentialStub {
  @Expose()
  @Type(() => User)
  owner!: User | null;
}

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

export type CredentialTransformerDto = DtoTransformerConfig<{
  PlainCls: typeof Credential;
  FullCls: typeof CredentialFull;
}>;

export type CredentialDtoConfig = DtoActionConfig<{
  create: CredentialCreateDto;
  update: CredentialUpdateDto;
}>;
