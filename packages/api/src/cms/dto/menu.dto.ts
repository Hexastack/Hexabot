/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  ValidateIf,
} from 'class-validator';

import { IsUUIDv4 } from '@/utils/decorators/is-uuid.decorator';
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
  type!: MenuType;

  @Expose()
  payload?: string | null;

  @Expose()
  url?: string | null;
}

@Exclude()
export class Menu extends MenuStub {
  @Expose({ name: 'parentId' })
  parent?: string | null;
}

@Exclude()
export class MenuFull extends MenuStub {
  @Expose()
  @Type(() => Menu)
  parent?: Menu | null;

  @Expose()
  @Type(() => Menu)
  children?: Menu[];
}

export class MenuCreateDto {
  @ApiProperty({ description: 'Menu title', type: String })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ description: 'Menu parent', type: String })
  @IsOptional()
  @IsString()
  @IsUUIDv4({
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
