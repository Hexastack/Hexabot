/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import {
  ArgumentMetadata,
  Injectable,
  Logger,
  PipeTransform,
} from '@nestjs/common';
import escapeRegExp from 'lodash/escapeRegExp';
import { Types } from 'mongoose';

import { TFilterQuery } from '@/utils/types/filter.types';

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
      allowedFields: TFilterNestedKeysOfType<
        T,
        null | undefined | string | string[]
      >[];
    },
  ) {}

  private getNullableValue(val: string) {
    return val === 'null' ? undefined : val;
  }

  private getRegexValue(val: string) {
    const escapedRegExp = escapeRegExp(val);
    return new RegExp(escapedRegExp, 'i');
  }

  private isAllowedField(field: string) {
    if (
      this.props.allowedFields.includes(
        field as TFilterNestedKeysOfType<
          T,
          null | undefined | string | string[]
        >,
      )
    )
      return true;
    Logger.warn(`Field ${field} is not allowed`);
    return false;
  }

  private transformField(field: string, val?: unknown): TTransformFieldProps {
    if (['id'].includes(field)) {
      if (Types.ObjectId.isValid(String(val))) {
        return {
          _operator: 'eq',
          data: {
            [field === 'id' ? '_id' : field]: this.getNullableValue(
              String(val),
            ),
          },
        };
      }
      return {};
    } else if (val?.['contains'] || val?.[field]?.['contains']) {
      return {
        _operator: 'iLike',
        data: {
          [field]: this.getRegexValue(
            String(val['contains'] || val[field]['contains']),
          ),
        },
      };
    } else if (val?.['!=']) {
      return {
        _operator: 'neq',
        data: {
          [field]: this.getNullableValue(val['!=']),
        },
      };
    } else if (val?.[`$in`]) {
      const inValues = (Array.isArray(val[`$in`]) ? val[`$in`] : [val[`$in`]])
        .map((v) => this.getNullableValue(String(v)))
        .filter((v) => v);

      if (inValues.length === 0) {
        return {};
      }

      return {
        _operator: `in`,
        data: {
          [field]: inValues,
        },
      };
    }

    return {
      _operator: 'eq',
      data: {
        [field]: Array.isArray(val)
          ? val.map((v) => this.getNullableValue(v)).filter((v) => v)
          : this.getNullableValue(String(val)),
      },
    };
  }

  /**
   * Merges a filter clause into the MongoDB query accumulator based on logical context (and/or/default).
   *
   * @param acc The current accumulator object for the MongoDB query.
   * @param _context The logical context for the filter ('and', 'or', or undefined).
   * @param filter The filter object to merge (excluding operator and data).
   * @param payload The filter data or query fragment to merge.
   * @returns The updated accumulator object with the new filter merged in the correct context.
   */
  private mergeMongoQueryByContext(
    acc: any,
    _context: string | undefined,
    filter: any,
    payload: any,
  ) {
    switch (_context) {
      case 'or':
        return {
          ...acc,
          $or: [...(acc?.$or || []), { ...filter, ...payload }],
        };
      case 'and':
        return {
          ...acc,
          $and: [...(acc?.$and || []), { ...filter, ...payload }],
        };
      default:
        return acc;
    }
  }

  async transform(value: TSearchFilterValue<T>, _metadata: ArgumentMetadata) {
    const whereParams = value['where'] ?? {};
    const filters: TTransformFieldProps[] = [];

    if (whereParams?.['or']) {
      Object.values(whereParams['or'])
        .filter((val) => val && this.isAllowedField(Object.keys(val)[0]))
        .map((val) => {
          if (!val) return false;
          const [field] = Object.keys(val);
          const filter = this.transformField(field, val?.[field]);
          if (filter._operator)
            filters.push({
              ...filter,
              _context: 'or',
            });
        });
    }

    delete whereParams['or'];

    if (whereParams) {
      Object.entries(whereParams)
        .filter(([field]) => this.isAllowedField(field))
        .forEach(([field, val]) => {
          const filter = this.transformField(field, val);

          if (filter._operator) {
            filters.push({
              ...filter,
              _context: 'and',
            });
          }
        });
    }

    return filters.reduce((acc, { _context, _operator, data, ...filter }) => {
      switch (_operator) {
        case 'neq':
          return {
            ...acc,
            $nor: [...(acc?.$nor || []), { ...filter, ...data }],
          };
        case 'in': {
          // Handle $in operator - convert to MongoDB $in syntax
          const inQuery = Object.entries(data || {}).reduce(
            (inAcc, [field, values]) => {
              return {
                ...inAcc,
                [field]: { $in: values },
              };
            },
            {},
          );
          if (_context === 'or' || _context === 'and') {
            return this.mergeMongoQueryByContext(
              acc,
              _context,
              filter,
              inQuery,
            );
          } else {
            return { ...acc, ...inQuery };
          }
        }
        default:
          return this.mergeMongoQueryByContext(acc, _context, filter, data);
      }
    }, {} as TFilterQuery<T>);
  }
}
