/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Document, Model, Query } from 'mongoose';

import { BaseRepository, DeleteResult } from '@/utils/generics/base-repository';
import { TFilterQuery } from '@/utils/types/filter.types';

import { LabelDto } from '../dto/label.dto';
import {
  Label,
  LABEL_POPULATE,
  LabelDocument,
  LabelFull,
  LabelPopulate,
} from '../schemas/label.schema';

@Injectable()
export class LabelRepository extends BaseRepository<
  Label,
  LabelPopulate,
  LabelFull,
  LabelDto
> {
  constructor(@InjectModel(Label.name) readonly model: Model<Label>) {
    super(model, Label, LABEL_POPULATE, LabelFull);
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
      'hook:label:create',
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
    const ids = Array.isArray(_criteria._id?.$in)
      ? _criteria._id.$in
      : Array.isArray(_criteria._id)
        ? _criteria._id
        : [_criteria._id];

    const labels = await this.find({ _id: { $in: ids } });
    this.eventEmitter.emit('hook:label:delete', labels);
  }
}
