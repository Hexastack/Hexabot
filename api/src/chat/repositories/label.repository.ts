/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 * 3. SaaS Restriction: This software, or any derivative of it, may not be used to offer a competing product or service (SaaS) without prior written consent from Hexastack. Offering the software as a service or using it in a commercial cloud environment without express permission is strictly prohibited.
 */

import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectModel } from '@nestjs/mongoose';
import { TFilterQuery, Model, Document, Query } from 'mongoose';

import { LoggerService } from '@/logger/logger.service';
import { BaseRepository, DeleteResult } from '@/utils/generics/base-repository';
import { PageQueryDto } from '@/utils/pagination/pagination-query.dto';

import { Label, LabelDocument, LabelFull } from '../schemas/label.schema';

@Injectable()
export class LabelRepository extends BaseRepository<Label, 'users'> {
  constructor(
    @InjectModel(Label.name) readonly model: Model<Label>,
    private readonly eventEmitter: EventEmitter2,
    private readonly logger: LoggerService,
  ) {
    super(model, Label);
  }

  /**
   * After creating a `Label`, this method emits an event and updates the `label_id` field.
   *
   * @param created - The created label document instance.
   *
   * @returns A promise that resolves when the update operation is complete.
   */
  async postCreate(created: LabelDocument): Promise<void> {
    this.eventEmitter.emit(
      'hook:chatbot:label:create',
      created,
      async (result: Record<string, any>) => {
        await this.model.updateOne(
          { _id: created._id },
          {
            $set: {
              label_id: {
                ...(created.label_id || {}),
                ...result,
              },
            },
          },
        );
      },
    );
  }

  /**
   * Before deleting a label, this method fetches the label(s) based on the given criteria and emits a delete event.
   *
   * @param query - The Mongoose query object used for deletion.
   * @param criteria - The filter criteria for finding the labels to be deleted.
   *
   * @returns {Promise<void>} A promise that resolves once the event is emitted.
   */
  async preDelete(
    _query: Query<
      DeleteResult,
      Document<Label, any, any>,
      unknown,
      Label,
      'deleteOne' | 'deleteMany'
    >,
    _criteria: TFilterQuery<Label>,
  ): Promise<void> {
    const labels = await this.find(
      typeof _criteria === 'string' ? { _id: _criteria } : _criteria,
    );
    this.eventEmitter.emit('hook:chatbot:label:delete', labels);
  }

  /**
   * Fetches all label documents and populates the `users` field which references the subscribers.
   *
   * @returns A promise that resolves with an array of fully populated `LabelFull` documents.
   */
  async findAllAndPopulate() {
    const query = this.findAllQuery().populate(['users']);
    return await this.execute(query, LabelFull);
  }

  /**
   * Fetches a paginated list of label documents based on filters and populates the `users` (subscribers) field.
   *
   * @param filters - The filter criteria for querying the labels.
   * @param pageQuery - The pagination query options.
   *
   * @returns A promise that resolves with a paginated array of fully populated `LabelFull` documents.
   */
  async findPageAndPopulate(
    filters: TFilterQuery<Label>,
    pageQuery: PageQueryDto<Label>,
  ) {
    const query = this.findPageQuery(filters, pageQuery).populate(['users']);
    return await this.execute(query, LabelFull);
  }

  /**
   * Fetches a single label document by its ID and populates the `users` (subscribers) field.
   *
   * @param id - The ID of the label to be fetched.
   *
   * @returns A promise that resolves with a fully populated label.
   */
  async findOneAndPopulate(id: string) {
    const query = this.findOneQuery(id).populate(['users']);
    return await this.executeOne(query, LabelFull);
  }
}
