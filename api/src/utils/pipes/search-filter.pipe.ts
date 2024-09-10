/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 * 3. SaaS Restriction: This software, or any derivative of it, may not be used to offer a competing product or service (SaaS) without prior written consent from Hexastack. Offering the software as a service or using it in a commercial cloud environment without express permission is strictly prohibited.
 */

import {
  Injectable,
  PipeTransform,
  ArgumentMetadata,
  Logger,
} from '@nestjs/common';
import { TFilterQuery, Types } from 'mongoose';

import {
  TFilterNestedKeysOfType,
  TSearchFilterValue,
  TTransformFieldProps,
} from '../types/filter.types';

@Injectable()
export class SearchFilterPipe<T>
  implements PipeTransform<TSearchFilterValue<T>, Promise<TFilterQuery<T>>>
{
  constructor(
    private readonly props: {
      allowedFields: TFilterNestedKeysOfType<T, string | string[]>[];
    },
  ) {}

  private getNullableValue(val: string) {
    return val === 'null' ? undefined : val;
  }

  private getRegexValue(val: string) {
    const quote = (str: string) =>
      str.replace(/([.?*+^$[\]\\(){}|-])/g, '\\$1');
    return new RegExp(quote(val), 'i');
  }

  private isAllowedField(field: string) {
    if (
      this.props.allowedFields.includes(
        field as TFilterNestedKeysOfType<T, string | string[]>,
      )
    )
      return true;
    Logger.warn(`Field ${field} is not allowed`);
    return false;
  }

  private transformField(field: string, val?: unknown): TTransformFieldProps {
    if (['id'].includes(field)) {
      if (Types.ObjectId.isValid(String(val[field])))
        return {
          operator: 'eq',
          [field === 'id' ? '_id' : field]: this.getNullableValue(val[field]),
        };
      return {};
    } else if (val['contains'] || val[field]?.['contains']) {
      return {
        operator: 'iLike',
        [field]: this.getRegexValue(
          String(val['contains'] || val[field]['contains']),
        ),
      };
    } else if (val['!=']) {
      return {
        operator: 'neq',
        [field]: this.getNullableValue(val['!=']),
      };
    }
    return {
      operator: 'eq',
      [field]: this.getNullableValue(String(val)),
    };
  }

  async transform(value: TSearchFilterValue<T>, _metadata: ArgumentMetadata) {
    const whereParams = value['where'] ?? {};
    const filters: TTransformFieldProps[] = [];
    if (whereParams?.['or'])
      Object.values(whereParams['or'])
        .filter((val) => this.isAllowedField(Object.keys(val)[0]))
        .map((val) => {
          const [field] = Object.keys(val);
          const filter = this.transformField(field, val[field]);
          if (filter.operator)
            filters.push({
              ...filter,
              context: 'or',
            });
        });

    delete whereParams['or'];
    if (whereParams)
      Object.entries(whereParams)
        .filter(([field]) => this.isAllowedField(field))
        .map(([field, val]) => {
          const filter = this.transformField(field, val);

          if (filter.operator)
            filters.push({
              ...filter,
              context: 'and',
            });
        });

    return filters.reduce(
      (acc, { context, operator, ...filter }) => ({
        ...acc,
        ...(operator === 'neq'
          ? { $nor: [...(acc?.$nor || []), filter] }
          : context === 'or'
            ? { $or: [...(acc?.$or || []), filter] }
            : context === 'and' && { $and: [...(acc?.$and || []), filter] }),
      }),
      {} as TFilterQuery<T>,
    );
  }
}
