/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { ModelDefinition, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Transform, Type } from 'class-transformer';
import { Schema as MongooseSchema } from 'mongoose';

import { BaseSchema } from '@/utils/generics/base-schema';
import { LifecycleHookManager } from '@/utils/generics/lifecycle-hook-manager';
import {
  TFilterPopulateFields,
  THydratedDocument,
} from '@/utils/types/filter.types';

import { MenuType } from './types/menu';

@Schema({ timestamps: true })
export class MenuStub extends BaseSchema {
  /**
   * The displayed title of the menu.
   */
  @Prop({ isRequired: true, type: String })
  title: string;

  /**
   * If this menu item is part of an other nested menu (parent), this will indicate that parent.
   */
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Menu',
    isRequired: false,
  })
  parent?: unknown;

  /**
   * Type of the menu item, one of: web_url, postback, nested.
   */
  @Prop({ type: String, enum: Object.values(MenuType), required: true })
  type: MenuType;

  /**
   * The content of the payload, if the menu item type is postback.
   */
  @Prop({ type: String })
  payload?: string;

  /**
   * The url if the menu item is web_url.
   */
  @Prop({ type: String, validate: (url: string | URL) => !!new URL(url) })
  url?: string;
}

@Schema({ timestamps: true })
export class Menu extends MenuStub {
  @Transform(({ obj }) => obj.parent?.toString())
  parent?: string;
}

@Schema({ timestamps: true })
export class MenuFull extends MenuStub {
  @Type(() => Menu)
  parent: Menu;
}

export type MenuDocument = THydratedDocument<Menu>;

// This is an optional additional validation step to enforce the data structure
// this function relies on two assumptions,
//  1. if a path is changed during an update or creation, the new value is already validated
//  2. if a document is created, it is already validated: the properties are already set

export const MenuModel: ModelDefinition = LifecycleHookManager.attach({
  name: Menu.name,
  schema: SchemaFactory.createForClass(MenuStub),
});

export default MenuModel.schema;

export type MenuPopulate = keyof TFilterPopulateFields<Menu, MenuStub>;

export const MENU_POPULATE: MenuPopulate[] = ['parent'];
