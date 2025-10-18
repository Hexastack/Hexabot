/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';
import {
  IsArray,
  IsEmail,
  IsNotEmpty,
  IsString,
  IsUUID,
} from 'class-validator';

import {
  BaseStub,
  DtoActionConfig,
  DtoTransformerConfig,
} from '@/utils/types/dto.types';

import { Role } from './role.dto';

@Exclude()
export class InvitationStub extends BaseStub {
  @Expose()
  email!: string;

  @Expose()
  token!: string;
}

@Exclude()
export class Invitation extends InvitationStub {
  @Expose({ name: 'roleIds' })
  roles!: string[];
}

@Exclude()
export class InvitationFull extends InvitationStub {
  @Expose()
  @Type(() => Role)
  roles!: Role[];
}

export class InvitationCreateDto {
  @ApiProperty({ description: 'Invitation roles', type: String })
  @IsNotEmpty()
  @IsArray()
  @IsUUID('4', { each: true, message: 'Role must be a valid UUID' })
  roles: string[];

  @ApiProperty({ description: 'Invitation email', type: String })
  @IsNotEmpty()
  @IsString()
  @IsEmail()
  email: string;

  token?: string;
}

export type InvitationTransformerDto = DtoTransformerConfig<{
  PlainCls: typeof Invitation;
  FullCls: typeof InvitationFull;
}>;

export type InvitationDtoConfig = DtoActionConfig<{
  create: InvitationCreateDto;
}>;
