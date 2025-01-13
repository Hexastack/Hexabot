/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { FlattenMaps } from 'mongoose';

import { DtoAction, DtoConfig, DtoInfer } from '../types/dto.types';

import { BaseRepository } from './base-repository';
import { BaseSchema } from './base-schema';

export abstract class BaseSeeder<
  T extends FlattenMaps<unknown>,
  P extends string = never,
  TFull extends Omit<T, P> = never,
  Dto extends DtoConfig = object,
  U extends Omit<T, keyof BaseSchema> = Omit<T, keyof BaseSchema>,
> {
  constructor(
    protected readonly repository: BaseRepository<T, P, TFull, Dto>,
  ) {}

  async findAll(): Promise<T[]> {
    return await this.repository.findAll();
  }

  async isEmpty(): Promise<boolean> {
    const count = await this.repository.countAll();
    return count === 0;
  }

  async seed(models: DtoInfer<DtoAction.Create, Dto, U>[]): Promise<boolean> {
    if (await this.isEmpty()) {
      await this.repository.createMany(models);
      return true;
    }
    return false;
  }
}
