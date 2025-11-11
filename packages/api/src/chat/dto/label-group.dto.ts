/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

import {
  BaseStub,
  DtoActionConfig,
  DtoTransformerConfig,
} from '@/utils/types/dto.types';

import { Label } from './label.dto';

@Exclude()
export class LabelGroupStub extends BaseStub {
  @Expose()
  name!: string;
}

@Exclude()
export class LabelGroup extends LabelGroupStub {
  @Exclude()
  labels?: never;
}

@Exclude()
export class LabelGroupFull extends LabelGroupStub {
  @Expose()
  @Type(() => Label)
  labels?: Label[];
}

export class LabelGroupCreateDto {
  @ApiProperty({ description: 'Label group name', type: String })
  @IsNotEmpty()
  @IsString()
  name: string;
}

export class LabelGroupUpdateDto extends LabelGroupCreateDto {}

export type LabelGroupTransformerDto = DtoTransformerConfig<{
  PlainCls: typeof LabelGroup;
  FullCls: typeof LabelGroupFull;
}>;

export type LabelGroupDtoConfig = DtoActionConfig<{
  create: LabelGroupCreateDto;
  update: LabelGroupUpdateDto;
}>;

export type LabelGroupDto = LabelGroupDtoConfig;
