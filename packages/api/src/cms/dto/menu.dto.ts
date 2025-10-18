/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  ValidateIf,
} from 'class-validator';

import {
  BaseStub,
  DtoActionConfig,
  DtoTransformerConfig,
} from '@/utils/types/dto.types';

import { MenuType } from '../entities/menu.entity';

@Exclude()
export class MenuStub extends BaseStub {
  @Expose()
  title!: string;

  @Expose()
  parent?: string | null;

  @Expose()
  type!: MenuType;

  @Expose()
  payload?: string | null;

  @Expose()
  url?: string | null;
}

@Exclude()
export class Menu extends MenuStub {}

@Exclude()
export class MenuFull extends Menu {}

export class MenuCreateDto {
  @ApiProperty({ description: 'Menu title', type: String })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ description: 'Menu parent', type: String })
  @IsOptional()
  @IsString()
  @IsUUID('4', {
    message: 'Parent must be a valid UUID',
  })
  parent?: string;

  @ApiProperty({
    description: 'Menu type',
    enumName: 'MenuType',
    enum: MenuType,
    type: MenuType,
  })
  @IsEnum(MenuType)
  @IsNotEmpty()
  type: MenuType;

  @ApiPropertyOptional({ description: 'Menu payload', type: String })
  @ValidateIf((o) => o.type == MenuType.postback)
  @IsOptional()
  @IsString()
  payload?: string;

  @ApiPropertyOptional({ description: 'Menu url', type: String })
  @ValidateIf((o) => o.type == MenuType.web_url)
  @IsOptional()
  @IsUrl()
  url?: string;
}

export class MenuUpdateDto extends PartialType(MenuCreateDto) {}

export class MenuQueryDto extends PartialType(MenuCreateDto) {}

export type MenuTransformerDto = DtoTransformerConfig<{
  PlainCls: typeof Menu;
  FullCls: typeof MenuFull;
}>;

export type MenuDtoConfig = DtoActionConfig<{
  create: MenuCreateDto;
  update: MenuUpdateDto;
}>;
