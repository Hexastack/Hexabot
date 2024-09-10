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
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';

import { Content } from '../schemas/content.schema';

@Injectable()
export class ContentTransformInterceptor
  implements NestInterceptor<Content, Content>
{
  /*
    -This interceptor is designed to provide a flattened representation of the 'dynamicFields'.
    -The incoming data contains a 'dynamicField' object, and the interceptor is expanding it, 
    extracting its content as separate entries.
    -After the expansion, the 'dynamicFields' property is removed.
    -The interceptor will be applied on each endpoint of this controller.
  */
  transformDynamicFields(data) {
    if (data.dynamicFields) {
      Object.keys(data.dynamicFields).forEach((key) => {
        data[key] = data.dynamicFields[key];
      });
      delete data.dynamicFields;
    }
    return data;
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<Content> {
    return next.handle().pipe(
      map((data) => {
        // If the data is not an array, the 'transformDynamicFields' method is applied once
        if (!Array.isArray(data)) {
          return this.transformDynamicFields(data);
        }

        return data.map((content) => {
          return this.transformDynamicFields(content);
        });
      }),
    );
  }
}
