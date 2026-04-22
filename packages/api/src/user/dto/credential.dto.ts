/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { coerceUser, type User } from '@hexabot-ai/types';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Exclude, Expose, Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

import { IsUUIDv4 } from '@/utils/decorators/is-uuid.decorator';
import { BaseStub, TDto } from '@/utils/types/dto.types';

@Exclude()
export class CredentialStub extends BaseStub {
  @Expose()
  name!: string;
}

@Exclude()
export class Credential extends CredentialStub {
  @Expose({ name: 'ownerId' })
  owner!: string;
}

@Exclude()
export class CredentialFull extends CredentialStub {
  @Expose()
  @Transform(({ value }) => (value == null ? value : coerceUser(value)))
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

export type CredentialDto = TDto<
  {
    plain: typeof Credential;
    full: typeof CredentialFull;
  },
  {
    create: CredentialCreateDto;
    update: CredentialUpdateDto;
  }
>;
