/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Menu } from '../schemas/menu.schema';
import { AnyMenu, MenuTree, MenuType } from '../schemas/types/menu';

const verifyMenu = (
  menu: AnyMenu<Menu> & {
    call_to_actions?: MenuTree;
  },
) => {
  // first check if menu is an object
  if (typeof menu !== 'object') return false;
  // check essential menu fields
  if (typeof menu.title !== 'string') return false;
  if (menu.type === MenuType.postback && typeof menu.payload === 'string')
    return true;
  if (
    menu.type === MenuType.web_url &&
    typeof menu.url === 'string' &&
    new URL(menu.url)
  )
    return true;
  if (
    menu.type === MenuType.nested &&
    (menu.call_to_actions === undefined || Array.isArray(menu.call_to_actions))
  )
    return true;
};

export const verifyTree = (menuTree?: MenuTree) => {
  if (!Array.isArray(menuTree)) return true;
  return !menuTree.some((v) => {
    const valid = verifyMenu(v);
    if (valid && v.type === MenuType.nested) {
      return !verifyTree(v.call_to_actions);
    }
    return !valid;
  });
};
