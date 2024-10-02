/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
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
