/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
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

          switch (_context) {
            case 'or':
              return {
                ...acc,
                $or: [...(acc?.$or || []), { ...filter, ...inQuery }],
              };
            case 'and':
              return {
                ...acc,
                $and: [...(acc?.$and || []), { ...filter, ...inQuery }],
              };
            default:
              return {
                ...acc,
                ...inQuery,
              };
          }
        }
        default:
          switch (_context) {
            case 'or':
              return {
                ...acc,
                $or: [...(acc?.$or || []), { ...filter, ...data }],
              };
            case 'and':
              return {
                ...acc,
                $and: [...(acc?.$and || []), { ...filter, ...data }],
              };
            default:
              return acc; // Handle any other cases if necessary
          }
      }
    }, {} as TFilterQuery<T>);
  }
}
