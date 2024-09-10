/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 * 3. SaaS Restriction: This software, or any derivative of it, may not be used to offer a competing product or service (SaaS) without prior written consent from Hexastack. Offering the software as a service or using it in a commercial cloud environment without express permission is strictly prohibited.
 */

import { ConflictException } from '@nestjs/common';
import { ClassTransformOptions } from 'class-transformer';
import { MongoError } from 'mongodb';
import { TFilterQuery } from 'mongoose';

import { BaseRepository } from './base-repository';
import { BaseSchema } from './base-schema';
import { PageQueryDto, QuerySortDto } from '../pagination/pagination-query.dto';

export abstract class BaseService<T extends BaseSchema> {
  constructor(readonly repository: BaseRepository<T, never>) {}

  async findOne(
    criteria: string | TFilterQuery<T>,
    options?: ClassTransformOptions,
  ): Promise<T> {
    return await this.repository.findOne(criteria, options);
  }

  async find(filter: TFilterQuery<T>, sort?: QuerySortDto<T>): Promise<T[]> {
    return await this.repository.find(filter, sort);
  }

  async findAll(sort?: QuerySortDto<T>): Promise<T[]> {
    return await this.repository.findAll(sort);
  }

  async findPage(
    filters: TFilterQuery<T>,
    pageQueryDto: PageQueryDto<T>,
  ): Promise<T[]> {
    return await this.repository.findPage(filters, pageQueryDto);
  }

  async countAll(): Promise<number> {
    return await this.repository.countAll();
  }

  async count(criteria?: TFilterQuery<T>): Promise<number> {
    return await this.repository.count(criteria);
  }

  async create<D extends Omit<T, keyof BaseSchema>>(dto: D): Promise<T> {
    try {
      return await this.repository.create(dto);
    } catch (error) {
      if (error instanceof MongoError && error.code === 11000) {
        throw new ConflictException(
          'Duplicate key error: element already exists',
        );
      }
      throw error;
    }
  }

  async findOneOrCreate<D extends Omit<T, keyof BaseSchema>>(
    criteria: string | TFilterQuery<T>,
    dto: D,
  ): Promise<T> {
    const result = await this.findOne(criteria);
    if (!result) {
      return await this.create(dto);
    }
    return result;
  }

  async createMany<D extends Omit<T, keyof BaseSchema>>(
    dtoArray: D[],
  ): Promise<T[]> {
    return await this.repository.createMany(dtoArray);
  }

  async updateOne<D extends Partial<Omit<T, keyof BaseSchema>>>(
    criteria: string | TFilterQuery<T>,
    dto: D,
  ): Promise<T> {
    return await this.repository.updateOne(criteria, dto);
  }

  async updateMany<D extends Partial<Omit<T, keyof BaseSchema>>>(
    filter: TFilterQuery<T>,
    dto: D,
  ) {
    return await this.repository.updateMany(filter, dto);
  }

  async deleteOne(criteria: string | TFilterQuery<T>) {
    return await this.repository.deleteOne(criteria);
  }

  async deleteMany(filter: TFilterQuery<T>) {
    return await this.repository.deleteMany(filter);
  }
}
