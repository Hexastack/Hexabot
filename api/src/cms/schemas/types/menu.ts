/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

import { Menu, MenuStub } from '../menu.schema';

export enum MenuType {
  web_url = 'web_url',
  postback = 'postback',
  nested = 'nested',
}
interface MenuAttrs {
  type: MenuType;
  payload?: unknown;
  url?: unknown;
}

export interface NestedMenuAttrs {
  type: MenuType.nested;
  payload?: never;
  url?: never;
}

export interface PostbackMenuAttrs {
  type: MenuType.postback;
  payload: string;
  url?: never;
}

export interface WebUrlMenuAttrs {
  type: MenuType.web_url;
  payload?: never;
  url: string;
}

type AnyMenuAttrs = NestedMenuAttrs | PostbackMenuAttrs | WebUrlMenuAttrs;

export type AnyMenu<T extends MenuStub = Menu> = Omit<T, keyof MenuAttrs> &
  AnyMenuAttrs;

export type MenuTree = (AnyMenu<Menu> & {
  call_to_actions?: MenuTree;
})[];
