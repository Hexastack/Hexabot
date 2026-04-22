/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  menuFullSchema,
  menuSchema,
  menuStubSchema,
  type Menu,
  type MenuFull,
  type MenuStub,
} from '@hexabot-ai/types';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  ValidateIf,
} from 'class-validator';

import { IsUUIDv4 } from '@/utils/decorators/is-uuid.decorator';
import { TDto } from '@/utils/types/dto.types';

import { MenuType } from '../enums/menu-type.enum';

export { menuFullSchema, menuSchema, menuStubSchema };

export type { Menu, MenuFull, MenuStub };

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

export type MenuDto = TDto<
  {
    plain: typeof menuSchema;
    full: typeof menuFullSchema;
  },
  {
    create: MenuCreateDto;
    update: MenuUpdateDto;
  }
>;
