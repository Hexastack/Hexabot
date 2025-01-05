/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { plainToClass } from 'class-transformer';
import { HydratedDocument, Model } from 'mongoose';

import { Metadata } from '../schemas/metadata.schema';

@Injectable()
export class MetadataService {
  constructor(
    @InjectModel(Metadata.name)
    private readonly metadataModel: Model<Metadata>,
  ) {}

  private toClassObject(metadata: HydratedDocument<Metadata>) {
    return plainToClass(
      Metadata,
      metadata.toObject({ virtuals: true, getters: true }),
      { excludePrefixes: ['_'] },
    );
  }

  async createOrUpdate(dto: Metadata) {
    const metadata = await this.metadataModel.findOneAndUpdate(
      { name: dto.name },
      dto,
      {
        upsert: true,
      },
    );
    return this.toClassObject(metadata);
  }

  async get(name: string) {
    const metadata = await this.metadataModel.findOne({ name });
    return this.toClassObject(metadata);
  }

  async set(name: string, value: any) {
    const metadata = await this.metadataModel.findOneAndUpdate(
      { name },
      { $set: { value } },
    );
    return this.toClassObject(metadata);
  }
}
