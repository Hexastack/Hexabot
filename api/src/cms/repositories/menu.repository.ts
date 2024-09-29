/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectModel } from '@nestjs/mongoose';
import { Document, Model, Query } from 'mongoose';

import { BaseRepository, DeleteResult } from '@/utils/generics/base-repository';

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
  MenuFull
> {
  constructor(
    @InjectModel(Menu.name) readonly model: Model<Menu>,
    private readonly eventEmitter: EventEmitter2,
  ) {
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

  /**
   * Post-create hook that triggers the event after a `Menu` document has been successfully created.
   *
   * @param created - The newly created `MenuDocument`.
   */
  async postCreate(created: MenuDocument): Promise<void> {
    this.eventEmitter.emit('hook:menu:create', created);
  }

  /**
   * @description
   * Post-update hook that triggers the event after a `Menu` document has been successfully updated.
   *
   * @param query - The query used to update the `Menu` document.
   * @param updated - The updated `Menu` document.
   */
  async postUpdate(
    _query: Query<
      Document<Menu, any, any>,
      Document<Menu, any, any>,
      unknown,
      Menu,
      'findOneAndUpdate'
    >,
    updated: Menu,
  ): Promise<void> {
    this.eventEmitter.emit('hook:menu:update', updated);
  }

  /**
   * Post-delete hook that triggers the event after a `Menu` document has been successfully deleted.
   *
   * @param query - The query used to delete the `Menu` document.
   * @param result - The result of the deletion.
   */
  async postDelete(
    _query: Query<
      DeleteResult,
      Document<Menu, any, any>,
      unknown,
      Menu,
      'deleteOne' | 'deleteMany'
    >,
    result: DeleteResult,
  ): Promise<void> {
    this.eventEmitter.emit('hook:menu:delete', result);
  }
}
