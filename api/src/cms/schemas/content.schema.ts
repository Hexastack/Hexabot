/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 * 3. SaaS Restriction: This software, or any derivative of it, may not be used to offer a competing product or service (SaaS) without prior written consent from Hexastack. Offering the software as a service or using it in a commercial cloud environment without express permission is strictly prohibited.
 */

import { Prop, Schema, SchemaFactory, ModelDefinition } from '@nestjs/mongoose';
import { Transform, Type } from 'class-transformer';
import mongoose, { Document } from 'mongoose';

import { config } from '@/config';
import { BaseSchema } from '@/utils/generics/base-schema';
import { LifecycleHookManager } from '@/utils/generics/lifecycle-hook-manager';

import { ContentType } from './content-type.schema';

export type ContentDocument = Document<Content>;

@Schema({ timestamps: true, strict: false })
export class ContentStub extends BaseSchema {
  /**
   * The content type of this content.
   */
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ContentType',
  })
  entity: unknown;

  /**
   * The title of the content.
   */
  @Prop({ type: String, required: true })
  title: string;

  /**
   * Either of not this content is active.
   */
  @Prop({ type: Boolean, default: true })
  status?: boolean;

  @Prop({ type: mongoose.Schema.Types.Mixed })
  dynamicFields?: Record<string, any>;

  @Prop({ type: String })
  rag?: string;

  /**
   * Helper to return the internal url of this content.
   */
  static getUrl(item: Content): string {
    return new URL('/content/view/' + item.id, config.apiPath).toString();
  }

  /**
   * Helper that returns the relative chatbot payload for this content.
   */
  static getPayload(item: Content): string {
    return 'postback' in item ? (item.postback as string) : item.title;
  }
}

@Schema({ timestamps: true })
export class Content extends ContentStub {
  @Transform(({ obj }) => obj.entity.toString())
  entity: string;

  static flatDynamicFields(element: Content) {
    Object.entries(element.dynamicFields).forEach(([key, value]) => {
      element[key] = value;
    });
    element.dynamicFields = undefined;
    return element;
  }
}

@Schema({ timestamps: true })
export class ContentFull extends ContentStub {
  @Type(() => ContentType)
  entity: ContentType;
}

const ContentSchema = SchemaFactory.createForClass(ContentStub);
ContentSchema.index(
  {
    title: 'text',
    rag: 'text',
  },
  {
    weights: {
      title: 2,
      rag: 1,
    },
    background: false,
  },
);

export const ContentModel: ModelDefinition = LifecycleHookManager.attach({
  name: Content.name,
  schema: ContentSchema,
});

export default ContentModel.schema;
