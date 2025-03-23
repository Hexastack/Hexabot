/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  Document,
  HydratedDocument,
  Model,
  Query,
  UpdateQuery,
  UpdateWithAggregationPipeline,
} from 'mongoose';

import { BaseRepository } from '@/utils/generics/base-repository';
import { TFilterQuery } from '@/utils/types/filter.types';

import { ContentDto } from '../dto/content.dto';
import {
  Content,
  CONTENT_POPULATE,
  ContentFull,
  ContentPopulate,
} from '../schemas/content.schema';

@Injectable()
export class ContentRepository extends BaseRepository<
  Content,
  ContentPopulate,
  ContentFull,
  ContentDto
> {
  constructor(@InjectModel(Content.name) readonly model: Model<Content>) {
    super(model, Content, CONTENT_POPULATE, ContentFull);
  }

  /**
   * A pre-create hook that processes the document before it is saved to the database.
   * It sets the `rag` field by stringifying the `dynamicFields` property of the document.
   *
   * @param doc - The document that is about to be created.
   */
  async preCreate(_doc: HydratedDocument<Content>) {
    _doc.set('rag', this.stringify(_doc.dynamicFields));
  }

  /**
   * A pre-update hook that modifies the update query before applying it to the database.
   * If the `dynamicFields` property is present in the update query, it sets the `rag` field accordingly.
   *
   * @param query - The Mongoose query for updating the document.
   * @param criteria - The filter criteria used for finding the document to update.
   * @param updates - The update operations to be applied to the document.
   */
  async preUpdate(
    _query: Query<
      Document<Content, any, any>,
      Document<Content, any, any>,
      unknown,
      Content,
      'findOneAndUpdate'
    >,
    _criteria: TFilterQuery<Content>,
    _updates:
      | UpdateWithAggregationPipeline
      | UpdateQuery<Document<Content, any, any>>,
  ): Promise<void> {
    if ('dynamicFields' in _updates['$set']) {
      _query.set('rag', this.stringify(_updates['$set']['dynamicFields']));
    }
  }

  /**
   * Converts the provided object to a string representation, joining each key-value pair
   * with a newline character.
   *
   * @param obj - The object to be stringified.
   *
   * @returns The string representation of the object.
   */
  private stringify(obj: Record<string, any>): string {
    return Object.entries(obj).reduce(
      (prev, cur) => `${prev}\n${cur[0]} : ${cur[1]}`,
      '',
    );
  }

  /**
   * Performs a full-text search on the `Content` model based on the provided query string.
   * The search is case-insensitive and diacritic-insensitive.
   *
   * @param query - The text query string to search for.
   * @returns A promise that resolves to the matching content documents.
   */
  async textSearch(query: string) {
    return await this.find({
      $text: {
        $search: query,
        $diacriticSensitive: false,
        $caseSensitive: false,
      },
    });
  }
}
