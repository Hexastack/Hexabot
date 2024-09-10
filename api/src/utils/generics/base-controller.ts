/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 * 3. SaaS Restriction: This software, or any derivative of it, may not be used to offer a competing product or service (SaaS) without prior written consent from Hexastack. Offering the software as a service or using it in a commercial cloud environment without express permission is strictly prohibited.
 */

import { NotFoundException } from '@nestjs/common';
import { TFilterQuery } from 'mongoose';

import { BaseSchema } from './base-schema';
import { BaseService } from './base-service';
import { TValidateProps, TFilterPopulateFields } from '../types/filter.types';

export abstract class BaseController<T extends BaseSchema, TStub = never> {
  constructor(private readonly service: BaseService<T>) {}

  /**
   * Checks if the given populate fields are allowed based on the allowed fields list.
   * @param populate - The list of populate fields.
   * @param  allowedFields - The list of allowed populate fields.
   * @return - True if all populate fields are allowed, otherwise false.
   */
  protected canPopulate(
    populate: string[],
    allowedFields: (keyof TFilterPopulateFields<T, TStub>)[],
  ): boolean {
    return (populate as typeof allowedFields).some((p) =>
      allowedFields.includes(p),
    );
  }

  /**
   * Validates the provided DTO against allowed IDs.
   * @param {TValidateProps<T, TStub>} - The validation properties
   * @throws {NotFoundException} Throws a NotFoundException if any invalid IDs are found.
   */
  protected validate({ dto, allowedIds }: TValidateProps<T, TStub>): void {
    const exceptions = [];
    Object.entries(dto)
      .filter(([key]) => Object.keys(allowedIds).includes(key))
      .forEach(([field]) => {
        const invalidIds = (
          Array.isArray(dto[field]) ? dto[field] : [dto[field]]
        ).filter(
          (id) =>
            !(
              Array.isArray(allowedIds[field])
                ? allowedIds[field]
                : [allowedIds[field]]
            ).includes(id),
        );

        if (invalidIds.length) {
          exceptions.push(
            `${field} with ID${
              invalidIds.length > 1 ? 's' : ''
            } '${invalidIds}' not found`,
          );
        }
      });

    if (exceptions.length) throw new NotFoundException(exceptions.join('; '));
  }

  /**
   * Counts filtered items.
   * @return Object containing the count of items.
   */
  async count(filters?: TFilterQuery<T>): Promise<{
    count: number;
  }> {
    return { count: await this.service.count(filters) };
  }
}
