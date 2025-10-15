/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import get from 'lodash/get';
import { Repository } from 'typeorm';

import { DeleteResult } from '@/utils/generics/base-repository';
import {
  PageQueryDto,
  QuerySortDto,
} from '@/utils/pagination/pagination-query.dto';
import { TFilterQuery } from '@/utils/types/filter.types';

import { Setting } from '../entities/setting.entity';
import { SettingType } from '../types';

type SortTuple = QuerySortDto<Setting>;

@Injectable()
export class SettingRepository {
  constructor(
    @InjectRepository(Setting)
    private readonly repository: Repository<Setting>,
  ) {}

  async findAll(sort?: SortTuple): Promise<Setting[]> {
    return await this.repository.find({
      order: this.normalizeSort(sort),
    });
  }

  async find(
    filter: TFilterQuery<Setting> = {},
    pageQuery?: PageQueryDto<Setting>,
  ): Promise<Setting[]> {
    const all = await this.repository.find();
    const filtered = this.applyFilter(all, filter);
    return this.applyPagination(filtered, pageQuery);
  }

  async count(filter: TFilterQuery<Setting> = {}): Promise<number> {
    const all = await this.repository.find();
    return this.applyFilter(all, filter).length;
  }

  async findOne(
    criteria: string | TFilterQuery<Setting>,
  ): Promise<Setting | null> {
    if (typeof criteria === 'string') {
      return (
        (await this.repository.findOne({ where: { id: criteria } })) ?? null
      );
    }

    const filtered = this.applyFilter(await this.repository.find(), criteria);
    return filtered[0] ?? null;
  }

  async create(setting: Partial<Setting>): Promise<Setting> {
    const entity = this.repository.create(setting);
    return await this.repository.save(entity);
  }

  async createMany(settings: Partial<Setting>[]): Promise<Setting[]> {
    const entities = this.repository.create(settings);
    return await this.repository.save(entities);
  }

  async update(id: string, payload: Partial<Setting>): Promise<Setting | null> {
    const entity = await this.repository.findOne({ where: { id } });
    if (!entity) {
      return null;
    }

    Object.assign(entity, payload);
    return await this.repository.save(entity);
  }

  async deleteMany(filter: TFilterQuery<Setting>): Promise<DeleteResult> {
    const matches = this.applyFilter(await this.repository.find(), filter);
    if (matches.length === 0) {
      return { acknowledged: true, deletedCount: 0 };
    }

    await this.repository.delete(matches.map((setting) => setting.id));
    return { acknowledged: true, deletedCount: matches.length };
  }

  private normalizeSort(sort?: SortTuple) {
    if (!sort) return undefined;
    const [property, order] = sort;
    const direction =
      order === 'asc' || order === 'ascending' || order === 1 ? 'ASC' : 'DESC';
    return { [property]: direction };
  }

  private applyPagination(
    settings: Setting[],
    pageQuery?: PageQueryDto<Setting>,
  ) {
    if (!pageQuery) return settings;
    const { skip, limit, sort } = pageQuery;
    const ordered = sort
      ? [...settings].sort((a, b) => this.sortComparator(a, b, sort))
      : settings;
    const start = skip ?? 0;
    const end = limit ? start + limit : undefined;
    return ordered.slice(start, end);
  }

  private sortComparator(a: Setting, b: Setting, sort: SortTuple) {
    const [property, order] = sort;
    const direction =
      order === 'asc' || order === 'ascending' || order === 1 ? 1 : -1;
    const aValue = get(a, property as string);
    const bValue = get(b, property as string);

    if (aValue === bValue) return 0;
    return aValue > bValue ? direction : -direction;
  }

  private applyFilter(
    settings: Setting[],
    filter: TFilterQuery<Setting> = {},
  ): Setting[] {
    if (!filter || Object.keys(filter).length === 0) {
      return settings;
    }

    return settings.filter((setting) => this.matchesFilter(setting, filter));
  }

  private matchesFilter(setting: Setting, filter: any): boolean {
    if (!filter) return true;

    if (Array.isArray(filter)) {
      return filter.every((f) => this.matchesFilter(setting, f));
    }

    if (filter.$and) {
      return filter.$and.every((rule: any) =>
        this.matchesFilter(setting, rule),
      );
    }

    if (filter.$or) {
      return filter.$or.some((rule: any) => this.matchesFilter(setting, rule));
    }

    if (filter.$nor) {
      return filter.$nor.every(
        (rule: any) => !this.matchesFilter(setting, rule),
      );
    }

    return Object.entries(filter).every(([key, value]) => {
      if (key.startsWith('$')) {
        return true;
      }

      const actualValue = get(setting, key);

      if (value instanceof RegExp) {
        return typeof actualValue === 'string'
          ? value.test(actualValue)
          : false;
      }

      if (value && typeof value === 'object' && !Array.isArray(value)) {
        if ('$regex' in value) {
          const regex = value.$regex as RegExp;
          return typeof actualValue === 'string'
            ? regex.test(actualValue)
            : false;
        }

        if ('$in' in value) {
          const values = Array.isArray(value.$in) ? value.$in : [value.$in];
          return values.includes(actualValue);
        }

        if ('$nin' in value) {
          const values = Array.isArray(value.$nin) ? value.$nin : [value.$nin];
          return !values.includes(actualValue);
        }

        if ('$eq' in value) {
          return this.matchesFilter(setting, { [key]: value.$eq });
        }
      }

      if (Array.isArray(value)) {
        return Array.isArray(actualValue)
          ? value.every((v) => actualValue.includes(v))
          : false;
      }

      return actualValue === value;
    });
  }

  public validateSettingValue(type: SettingType, value: any) {
    if (
      (type === SettingType.text || type === SettingType.textarea) &&
      typeof value !== 'string' &&
      value !== null
    ) {
      throw new Error('Setting value must be a string.');
    } else if (type === SettingType.multiple_text) {
      if (!this.isArrayOfString(value)) {
        throw new Error('Setting value must be an array of strings.');
      }
    } else if (
      type === SettingType.checkbox &&
      typeof value !== 'boolean' &&
      value !== null
    ) {
      throw new Error('Setting value must be a boolean.');
    } else if (
      type === SettingType.number &&
      typeof value !== 'number' &&
      value !== null
    ) {
      throw new Error('Setting value must be a number.');
    } else if (type === SettingType.multiple_attachment) {
      if (!this.isArrayOfString(value)) {
        throw new Error('Setting value must be an array of attachment ids.');
      }
    } else if (type === SettingType.attachment) {
      if (typeof value !== 'string' && value !== null) {
        throw new Error('Setting value must be a string or null.');
      }
    } else if (type === SettingType.secret && typeof value !== 'string') {
      throw new Error('Setting value must be a string.');
    } else if (type === SettingType.select && typeof value !== 'string') {
      throw new Error('Setting value must be a string.');
    }
  }

  private isArrayOfString(value: any): boolean {
    return Array.isArray(value) && value.every((v) => typeof v === 'string');
  }
}
