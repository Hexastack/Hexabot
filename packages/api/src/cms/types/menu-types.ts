/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Menu, MenuStub } from '../dto/menu.dto';
import { MenuType } from '../entities/menu.entity';

interface MenuAttrs {
  type: MenuType;
  payload?: unknown;
  url?: unknown;
}

export interface NestedMenuDtoAttrs {
  type: MenuType.nested;
  payload?: never;
  url?: never;
}

export interface PostbackMenuDtoAttrs {
  type: MenuType.postback;
  payload: string;
  url?: never;
}

export interface WebUrlMenuDtoAttrs {
  type: MenuType.web_url;
  payload?: never;
  url: string;
}

type AnyMenuAttrs =
  | NestedMenuDtoAttrs
  | PostbackMenuDtoAttrs
  | WebUrlMenuDtoAttrs;

export type AnyMenuDto<T extends MenuStub = Menu> = Omit<T, keyof MenuAttrs> &
  AnyMenuAttrs;

export type MenuTreeDto = (AnyMenuDto<Menu> & {
  call_to_actions?: MenuTreeDto;
})[];
