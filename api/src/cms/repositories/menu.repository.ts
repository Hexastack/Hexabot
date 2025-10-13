/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { BaseRepository } from '@/utils/generics/base-repository';

import { MenuDto } from '../dto/menu.dto';
import {
  Menu,
  MENU_POPULATE,
  MenuDocument,
  MenuFull,
  MenuPopulate,
} from '../schemas/menu.schema';
import { MenuType } from '../schemas/types/menu';

@Injectable()
export class MenuRepository extends BaseRepository<
  Menu,
  MenuPopulate,
  MenuFull,
  MenuDto
> {
  constructor(@InjectModel(Menu.name) readonly model: Model<Menu>) {
    super(model, Menu, MENU_POPULATE, MenuFull);
  }

  /**
   * Pre-create validation hook that checks the `MenuDocument` before it is created.
   * It throws an error if certain fields (like `type` or `payload`) are missing or illegally modified.
   *
   * @param doc - The document to be validated before creation.
   */
  async preCreate(_doc: MenuDocument) {
    if (_doc) {
      const modifiedPaths = _doc.modifiedPaths();
      if (!_doc?.isNew) {
        if (modifiedPaths.includes('type'))
          throw new Error("Illegal Update: can't update type");
      }

      switch (_doc.type) {
        case MenuType.postback:
          if (!modifiedPaths.includes('payload'))
            throw new Error(
              "Menu Validation Error: doesn't include payload for type postback",
            );

          break;
        case MenuType.web_url:
          if (!modifiedPaths.includes('url'))
            throw new Error(
              "Menu Validation Error: doesn't include url for type web_url",
            );
          break;
        default:
          break;
      }
    }
  }
}
